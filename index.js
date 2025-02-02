import readlineSync from "readline-sync";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// MongoDB connection setup
let db;
async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("todoApp");
  console.log("Connected to MongoDB");
}

// Database operations
async function insertTodo(title, description, dueDate) {
  const todo = {
    title,
    description,
    dueDate: new Date(dueDate),
    status: "pending",
  };
  await db.collection("todos").insertOne(todo);
  return todo;
}

async function updateTodo(id, updates) {
  const updateDoc = { $set: updates };
  if (updates.dueDate) updateDoc.$set.dueDate = new Date(updates.dueDate);
  await db.collection("todos").updateOne({ _id: new ObjectId(id) }, updateDoc);
  return await db.collection("todos").findOne({ _id: new ObjectId(id) });
}

async function deleteTodo(id) {
  return await db.collection("todos").deleteOne({ _id: new ObjectId(id) });
}

async function viewTodos() {
  return await db.collection("todos").find().toArray();
}

// AI response generator
async function generateAIResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "AI service unavailable. Here's your result:";
  }
}

// Main application flow
async function main() {
  await connectDB();

  while (true) {
    const action = readlineSync.question(
      "\nChoose action:\n1. Add Todo\n2. View Todos\n3. Update Todo\n4. Delete Todo\n5. Exit\n> "
    );

    switch (action) {
      case "1": {
        const title = readlineSync.question("Title: ");
        const description = readlineSync.question("Description: ");
        const dueDate = readlineSync.question("Due Date (YYYY-MM-DD): ");
        const newTodo = await insertTodo(title, description, dueDate);
        const aiResponse = await generateAIResponse(
          `Generate a confirmation message for creating a todo titled "${newTodo.title} with due date ${newTodo.dueDate} and status ${newTodo.status} ${newTodo._id}"`
        );
        console.log("\n" + aiResponse);
        break;
      }

      case "2": {
        const todos = await viewTodos();
        const aiResponse = await generateAIResponse(
          `Format these todos as a prioritized list: ${JSON.stringify(todos)}`
        );
        console.log("\n" + aiResponse);
        break;
      }

      case "3": {
        const id = readlineSync.question("Todo ID to update: ");
        const field = readlineSync.question(
          "Field to update (title/description/dueDate/status): "
        );
        const value = readlineSync.question("New value: ");
        const updatedTodo = await updateTodo(id, { [field]: value });
        const aiResponse = await generateAIResponse(
          `Create an update confirmation message for todo ID ${id}`
        );
        console.log("\n" + aiResponse);
        break;
      }

      case "4": {
        const id = readlineSync.question("Todo ID to delete: ");
        await deleteTodo(id);
        const aiResponse = await generateAIResponse(
          `Generate a deletion confirmation message for todo ID ${id}`
        );
        console.log("\n" + aiResponse);
        break;
      }

      case "5":
        console.log("Exiting...");
        process.exit(0);

      default:
        console.log("Invalid option");
    }
  }
}

main().catch(console.error);
