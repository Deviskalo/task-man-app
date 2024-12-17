import webpush from 'web-push';
import { getToken } from "next-auth/jwt";
import prisma from "../../lib/prisma"; // Assuming you're using Prisma for database access

webpush.setVapidDetails(
    'mailto:deviskalo2000@gmail.com',
    'BBgIU2putnf2HxUgHU68YDfxm5adSWZFu5oRb_dt8eMHvAK951TynkrkeS8wiHbLLxxyVSAZSVmuSTpkKcl9f-A',
    'vzAH81crcFq2GQjkekC82ciJ3ng2eCWzlknLIfxtngs'
);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = token.sub;
        const subscription = req.body;

        try {
            // Store the subscription in the database
            await prisma.subscription.create({
                data: {
                    userId: userId,
                    endpoint: subscription.endpoint,
                    keys: JSON.stringify(subscription.keys) // Convert keys to a JSON string
                }
            });

            res.status(201).json({ message: 'Subscription successful' });
        } catch (error) {
            console.error('Error storing subscription:', error);
            res.status(500).json({ error: 'Failed to store subscription' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
