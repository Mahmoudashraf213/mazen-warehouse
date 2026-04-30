import { Invoice } from "../../../db/index.js";

// Dashboard Reports
export const getDashboard = async (req, res, next) => {
  const now = new Date();

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const startOfMonth = new Date();
  startOfMonth.setMonth(startOfMonth.getMonth() - 1);

  const startOfYear = new Date();
  startOfYear.setFullYear(startOfYear.getFullYear() - 1);

  const calc = async (startDate) => {
    const invoices = await Invoice.find({
      createdAt: { $gte: startDate },
    });

    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalDue = invoices.reduce((acc, inv) => acc + inv.dueAmount, 0);

    return {
      totalSales,
      totalPaid,
      totalDue,
      count: invoices.length,
    };
  };

  const daily = await calc(startOfDay);
  const weekly = await calc(startOfWeek);
  const monthly = await calc(startOfMonth);
  const yearly = await calc(startOfYear);

  return res.status(200).json({
    success: true,
    data: {
      daily,
      weekly,
      monthly,
      yearly,
    },
  });
};