export {};

declare global {

    interface Member {
        id: string;
        organizationId: string;
        role: "admin" | "member" | "owner";
        createdAt: Date;
        userId: string;
        user: {
            id: string;
            email: string;
            name: string;
            image?: string;
        };
    }

    interface Organization {
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        members: Member[];
        invitations: unknown[];
    }

}
