import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db'
import { randomInt, randomUUID } from 'crypto'
import { clerkMiddleware, getAuth } from '@clerk/express'

const app = express()

app.use(helmet())
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('dev'))
app.use(clerkMiddleware())

app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.post('/workspace', async (req, res) => {
    const { userId } = getAuth(req)

    const user = await prisma.user.findFirst({
        where: {
            clerkId: userId,
        },
    })

    if (!user) {
        return res.json({ error: 'User not found in db' }).status(404);
    }
    const workspace = await prisma.workspace.create({
        data: {
            adminId: user.id,
            location: req.body.location,
            memberships: {
                create: [{ user: { connect: { id: user.id } } }],
            },
        },
    });

    res.json(workspace).status(200);
})

app.get('/workspace', (req, res) => {
    res.json(getAuth(req))
})

const port = process.env.PORT ?? 4000
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`)
})
