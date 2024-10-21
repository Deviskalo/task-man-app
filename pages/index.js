import { useState, useEffect } from 'react'
import { useSession, signOut } from "next-auth/react"
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import toast from 'react-hot-toast'
import * as Yup from 'yup'
import { CATEGORIES } from '../utils/constants'
import ErrorBoundary from '../components/ErrorBoundary'
import LoadingSpinner from '../components/LoadingSpinner'

const taskSchema = Yup.object().shape({
    title: Yup.string().required('Title is required').max(100, 'Title is too long'),
    category: Yup.string().max(50, 'Category is too long'),
    dueDate: Yup.date().nullable().min(new Date(), 'Due date cannot be in the past'),
    priority: Yup.number().oneOf([1, 2, 3], 'Invalid priority')
})

const priorityColors = {
    1: 'bg-green-200 text-green-800',
    2: 'bg-yellow-200 text-yellow-800',
    3: 'bg-red-200 text-red-800'
};

const priorityLabels = ['Low', 'Medium', 'High'];

export default function Home() {
    const { data: session, status } = useSession()
    const [tasks, setTasks] = useState([])
    const [newTask, setNewTask] = useState({
        title: '',
        category: 'Personal', // Set a default category
        dueDate: new Date().toISOString().split('T')[0], // Set today as the default due date
        priority: 1
    })
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalTasks, setTotalTasks] = useState(0)
    const [newCategory, setNewCategory] = useState(CATEGORIES[0])
    const [searchTerm, setSearchTerm] = useState('')
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tasksPerPage] = useState(5); // You can adjust this number as needed

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchTasks(currentPage, searchTerm)
        }
    }, [session, searchTerm, currentPage])

    const fetchTasks = async (page = currentPage, search = searchTerm) => {
        if (!session) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/tasks?page=${page}&search=${encodeURIComponent(search)}&limit=${tasksPerPage}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks);
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
                setTotalTasks(data.totalTasks);
            } else {
                toast.error('Failed to fetch tasks');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('An error occurred while fetching tasks');
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const addedTask = await response.json();
            setTasks(prevTasks => [addedTask, ...prevTasks]);
            setNewTask({
                title: '',
                category: 'Personal',
                dueDate: new Date().toISOString().split('T')[0],
                priority: 1
            });
            toast.success('Task added successfully');
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error(error.message || 'Failed to add task');
        }
    };

    const startEditing = (task) => {
        setEditingTask({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            priority: task.priority || 1
        });
    };

    const cancelEditing = () => {
        setEditingTask(null);
    };

    const updateTask = async (id, updates = null) => {
        if (updates === null) {
            // If no updates provided, set the task to edit mode
            const taskToEdit = tasks.find(task => task.id === id);
            setEditingTask(taskToEdit);
            return;
        }

        try {
            const response = await fetch(`/api/tasks?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const updatedTask = await response.json();
            setTasks(tasks => tasks.map(task => task.id === id ? updatedTask : task));
            setEditingTask(null); // Clear editing state
            toast.success('Task updated successfully');
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error(error.message || 'Failed to update task');
        }
    };

    const deleteTask = async (id) => {
        try {
            const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete task');
            }
            setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
            toast.success('Task deleted successfully');
            fetchTasks(currentPage); // Refetch the current page of tasks
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error(error.message || 'Failed to delete task');
        }
    };

    const toggleTaskCompletion = async (id, completed) => {
        await updateTask(id, { completed: !completed });
    };

    const handleSignOut = async () => {
        try {
            await signOut({ redirect: false });
            toast.success('Signed out successfully');
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Failed to sign out');
        }
    };

    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchTasks(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchTasks(currentPage + 1);
        }
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (!session) {
        return null;
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <ErrorBoundary>
            <div className="container mx-auto p-4">
                <Head>
                    <title>Task Manager</title>
                </Head>

                <main>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">Task Manager</h1>
                        <button onClick={handleSignOut} className="bg-red-500 text-white px-4 py-2 rounded">
                            Sign Out
                        </button>
                    </div>

                    {/* Search Box */}
                    <div className="mb-4">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search tasks here..."
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    {/* Add Task Form */}
                    <form onSubmit={addTask} className="mb-4 space-y-4">
                        <div>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="New task"
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div className="flex space-x-2">
                            <select
                                value={newTask.category}
                                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            >
                                {CATEGORIES.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={newTask.dueDate}
                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <select
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                                className="p-2 border rounded"
                            >
                                <option value={1}>Low</option>
                                <option value={2}>Medium</option>
                                <option value={3}>High</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Add Task
                        </button>
                    </form>

                    <ul className="space-y-4">
                        {loading ? (
                            <li>Loading tasks...</li>
                        ) : tasks.length > 0 ? (
                            tasks.map(task => (
                                <li key={task.id} className="p-4 border rounded shadow mb-4">
                                    {editingTask && editingTask.id === task.id ? (
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            updateTask(task.id, editingTask);
                                        }}>
                                            <input
                                                type="text"
                                                value={editingTask.title}
                                                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                                className="mb-2 p-2 border rounded w-full"
                                            />
                                            <input
                                                type="text"
                                                value={editingTask.category}
                                                onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                                                className="mb-2 p-2 border rounded w-full"
                                            />
                                            <input
                                                type="date"
                                                value={editingTask.dueDate}
                                                onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                                                className="mb-2 p-2 border rounded w-full"
                                            />
                                            <select
                                                value={newTask.priority}
                                                onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            >
                                                <option value={1}>Low</option>
                                                <option value={2}>Medium</option>
                                                <option value={3}>High</option>
                                            </select>
                                            <div>
                                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Save</button>
                                                <button type="button" onClick={() => setEditingTask(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <input
                                                        type="checkbox"
                                                        checked={task.completed}
                                                        onChange={() => updateTask(task.id, { completed: !task.completed })}
                                                        className="mr-2"
                                                    />
                                                    <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
                                                </div>
                                                <div>
                                                    <button onClick={() => updateTask(task.id)} className="text-blue-500 mr-2">Edit</button>
                                                    <button onClick={() => deleteTask(task.id)} className="text-red-500">Delete</button>
                                                </div>
                                            </div>
                                            <div className="flex justify-around items-center mt-2 text-sm text-gray-600">
                                                <p>Category: {task.category}</p>
                                                <p>Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>
                                                <p>Priority: {task.priority}</p>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))
                        ) : (
                            <li>No tasks available</li>
                        )}
                    </ul>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1 || loading}
                                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                            >
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages} (Total tasks: {totalTasks})</span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || loading}
                                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </ErrorBoundary>
    )
}
