import { getToken } from "next-auth/jwt"
import prisma from "../../lib/prisma"
import * as Yup from 'yup'
import { CATEGORIES } from '../../utils/constants'

const ITEMS_PER_PAGE = 10 // Reduced from 10 to 5 for easier testing

const taskSchema = Yup.object().shape({
    title: Yup.string().required('Title is required').max(100, 'Title is too long'),
    category: Yup.string().oneOf(CATEGORIES, 'Invalid category'),
    dueDate: Yup.date().nullable().transform((curr, orig) => orig === '' ? null : curr),
    priority: Yup.number().oneOf([1, 2, 3], 'Invalid priority').nullable(),
    completed: Yup.boolean()
})

export default async function handler(req, res) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const userId = token.sub

    if (req.method === 'PUT') {
        try {
            const { id } = req.query;
            const updates = req.body;

            // Only validate the fields that are being updated
            const partialSchema = Yup.object().shape({
                title: Yup.string().max(100, 'Title is too long'),
                category: Yup.string().oneOf(CATEGORIES, 'Invalid category'),
                dueDate: Yup.date().nullable().transform((curr, orig) => orig === '' ? null : curr),
                priority: Yup.number().oneOf([1, 2, 3], 'Invalid priority'),
                completed: Yup.boolean()
            });

            await partialSchema.validate(updates, { abortEarly: false, strict: false });

            const updatedTask = await prisma.task.update({
                where: { id: id, userId: userId },
                data: {
                    ...updates,
                    dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
                    priority: updates.priority ? Number(updates.priority) : undefined
                }
            });
            res.status(200).json(updatedTask);
        } catch (error) {
            if (error instanceof Yup.ValidationError) {
                res.status(400).json({ error: error.errors });
            } else {
                console.error('Error updating task:', error);
                res.status(500).json({ error: 'Failed to update task' });
            }
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { id } = req.query
            await prisma.task.delete({
                where: {
                    id: id,
                    userId: userId
                }
            })
            res.status(200).json({ message: 'Task deleted successfully' })
        } catch (error) {
            console.error('Error deleting task:', error)
            res.status(500).json({ error: 'Failed to delete task' })
        }
    } else if (req.method === 'POST') {
        try {
            const { title, category, dueDate, priority } = req.body;

            // Validation
            if (!title || !category || !dueDate) {
                return res.status(400).json({ error: 'Title, category, and due date are required' });
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    category,
                    dueDate: new Date(dueDate),
                    priority: Number(priority),
                    userId
                }
            });
            res.status(201).json(task);
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    } else if (req.method === 'GET') {
        const { page = 1, limit = 5, search = '' } = req.query;
        const skip = (page - 1) * parseInt(limit);

        try {
            let where = { userId: userId };

            if (search) {
                where = {
                    ...where,
                    OR: [
                        { title: { contains: search } },
                        { category: { contains: search } },
                    ],
                };
            }

            const tasks = await prisma.task.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            });

            const totalTasks = await prisma.task.count({ where });
            const totalPages = Math.ceil(totalTasks / parseInt(limit));

            res.status(200).json({
                tasks,
                totalTasks,
                currentPage: parseInt(page),
                totalPages
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    }
    else {
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
