import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Invoice } from '@/lib/models/Invoice';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'sales')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const db = await getDb();
    
    // Build query filter
    let filter: any = { _id: new ObjectId(params.id), isActive: true };
    
    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    const invoice = await db.collection<Invoice>('invoices').findOne(filter);

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Get invoice API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'sales')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const invoiceData = await request.json();
    const db = await getDb();
    
    // Build query filter
    let filter: any = { _id: new ObjectId(params.id), isActive: true };
    
    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Check if invoice exists and user has access
    const existingInvoice = await db.collection<Invoice>('invoices').findOne(filter);
    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, message: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update payment status and amounts
    if (invoiceData.paidAmount !== undefined) {
      const paidAmount = parseFloat(invoiceData.paidAmount) || 0;
      const remainingAmount = existingInvoice.grandTotal - paidAmount;
      
      updateData.paidAmount = paidAmount;
      updateData.remainingAmount = remainingAmount;
      
      // Update status based on payment
      if (paidAmount >= existingInvoice.grandTotal) {
        updateData.status = 'paid';
      } else if (paidAmount > 0) {
        updateData.status = 'partially_paid';
      } else {
        updateData.status = 'unpaid';
      }
    }

    // Update other fields if provided
    if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes.trim();
    if (invoiceData.dueDate) updateData.dueDate = new Date(invoiceData.dueDate);

    const result = await db.collection<Invoice>('invoices').updateOne(
      filter,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update invoice API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'sales')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const db = await getDb();
    
    // Build query filter
    let filter: any = { _id: new ObjectId(params.id) };
    
    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Soft delete by setting isActive to false
    const result = await db.collection<Invoice>('invoices').updateOne(
      filter,
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invoice API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}