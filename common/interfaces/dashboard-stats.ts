export interface DashboardStats {
    donationsCount: number;
    totalDonationAmount: number;
    pendingDonationsCount: number;
    completedDonationsCount: number;
    membersCount: number;
    pendingMembersCount: number;
    validatedMembersCount: number;
    completedMembersCount: number;
    ordersCount: number;
    pendingOrdersCount: number;
    completedOrdersCount: number;
    totalOrdersAmount: number;
    productsCount: number;
    newsCount: number;
    photosCount: number;
    recentDonations: Array<{
        idDonation: string;
        firstName: string;
        lastName: string;
        amount: number;
        isPaid: string;
        registrationDate: string;
    }>;
    recentOrders: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        isPaid: string;
        date: string;
        totalAmount: number;
    }>;
    transactions?: {
        total: number;
        completed: number;
        pending: number;
        failed: number;
        conversionRate: number;
        totalAmount: number;
        completedAmount: number;
        byType: {
            donation: number;
            membership: number;
            product: number;
        };
    };
    recentTransactions?: Array<{
        id: string;
        type: string;
        amount: number;
        status: string;
        payerName: string;
        initiatedAt: string;
        completedAt?: string;
    }>;
}
