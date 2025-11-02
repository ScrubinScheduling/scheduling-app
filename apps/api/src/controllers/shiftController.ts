import { prisma } from '../db';

export const getAllShifts = async (_req: any, _res: any) => {
    try {
        const shifts = await prisma.shift.findMany({
            include: { user: true }
        })
        _res.json(shifts);
    } catch (err: any) {
        _res.status(500).json({ 
            error: err.message,
        });
    }
};