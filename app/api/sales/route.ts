import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkModuleAccess } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { Invoice } from '@/lib/models/Invoice';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'sales')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const db = await getDb();
    
    // Build query filter
    let filter: any = {
      isActive: true
    };

    // Add company filter for non-super-admin users
    if (session.role !== 'super-admin' && session.companyId) {
      filter.companyId = new ObjectId(session.companyId);
    }

    // Add status filter if specified
    if (status && ['paid', 'partially_paid', 'unpaid'].includes(status)) {
      filter.status = status;
    }

    // Add search filter if specified
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await db.collection<Invoice>('invoices')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Get invoices API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !checkModuleAccess(session.modules, 'sales')) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 403 }
      );
    }

    if (!session.companyId && session.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, message: 'يجب أن تكون مرتبطاً بشركة' },
        { status: 400 }
      );
    }

    const invoiceData = await request.json();
    
    // Validate required fields
    if (!invoiceData.customerId || !invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'يجب اختيار عميل وإضافة عناصر للفاتورة' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Get customer details
    const customer = await db.collection('contacts').findOne({
      _id: new ObjectId(invoiceData.customerId),
      type: 'customer',
      isActive: true
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'العميل غير موجود' },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    const processedLineItems = invoiceData.lineItems.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = (itemSubtotal * item.taxPercent) / 100;
      const itemTotal = itemSubtotal + itemTax;
      
      subtotal += itemSubtotal;
      totalTax += itemTax;

      return {
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        taxPercent: parseFloat(item.taxPercent),
        total: itemTotal
      };
    });

    const grandTotal = subtotal + totalTax;

    // Generate invoice number
    const invoiceCount = await db.collection('invoices').countDocuments({
      companyId: session.role === 'super-admin' && invoiceData.companyId 
        ? new ObjectId(invoiceData.companyId)
        : new ObjectId(session.companyId!)
    });
    
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    const companyId = session.role === 'super-admin' && invoiceData.companyId 
      ? new ObjectId(invoiceData.companyId)
      : new ObjectId(session.companyId!);

    const invoice: Omit<Invoice, '_id'> = {
      invoiceNumber,
      customerId: new ObjectId(invoiceData.customerId),
      customerName: customer.name,
      customerEmail: customer.email,
      companyId,
      lineItems: processedLineItems,
      subtotal,
      totalTax,
      grandTotal,
      status: 'unpaid',
      paidAmount: 0,
      remainingAmount: grandTotal,
      issueDate: new Date(),
      dueDate: new Date(invoiceData.dueDate),
      notes: invoiceData.notes?.trim() || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId),
    };

    const result = await db.collection<Invoice>('invoices').insertOne(invoice);

    return NextResponse.json({ success: true, id: result.insertedId, invoiceNumber });
  } catch (error) {
    console.error('Create invoice API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}