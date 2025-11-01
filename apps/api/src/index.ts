import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './db';
import { randomInt, randomUUID } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(morgan('dev'));




/*
 Creates a dummy user for testing
*/

app.post('/dummy-setup', async (req, res) => {
  const {userId, location = 'Canada', roleName = "DummyAdmin", permissions = 0} = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create User
      const user =
        userId
          ? await tx.user.findUnique({ where: { id: Number(userId) } })
          : await tx.user.create({ data: { clerkId: `dummy-${randomUUID()}` } });

      if (!user) {
        return {status: 404, error: `User ${userId} not found`};
      }

      // Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          adminId: user.id,
          location
        }
      });

      // Create Role
      const role = await tx.role.create({
        data: {
          name: roleName,
          permissions,
          workspaceId: workspace.id
        }
      });

      // Create Workspace Membership
      await tx.userWorkspaceMembership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
        }
      });

      // Create Role Membership
      await tx.userRoleMembership.create({
        data: {
          userId: user.id,
          workSpaceId: workspace.id,
          roleId: role.id,
        }
      });

      // Full User
      const fullUser = await tx.user.findUnique({
        where: {id: user.id},
        include: {
          UserWorkspaceMembership: {include: {workspace: true}}, 
          UserRoleMembership: {include: {role: true, workspace: true}}
        }
      }); 

      return {status: 201, payload: {user: fullUser, workspace, role}};
    });

   if ("error" in result) return res.status(result.status).json({error: result.error}); 
   return res.status(result.status).json(result.payload); 

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/dummy-create-shift', async(req,res) => {
  
  try {
    const {worspaceId, employee, shifts, breakDuration} = req.body;
  
  
    const rows = shifts.map(({startTime, endTime}: {startTime: string, endTime: string}) => {
      const start = new Date(startTime);
      const end = new Date(endTime); 
    
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Invalid ISO time"); 
      if (end <= start) throw new Error("endTime must be after startTime");
    
      return {
        userId: employee,
        worspaceId: Number(worspaceId),
        breakDuration: Number(worspaceId) || 30,
        startTime: start,
        endTime: end
      }
    });

    const result = await prisma.shift.createMany({data: rows});
    console.log(result.count);  
    res.status(201).json({inserted: result.count}); 
    

  } catch(err) {
    console.log("Error in index route", err); 
    res.status(500).json({message: "Internal Server Error"}); 
  }

})


const port = process.env.PORT ?? 4000
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});


