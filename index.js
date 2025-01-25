import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config()
console.log(process.env.OPENAI_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo-1106",
  store: true,
  messages: [{ role: "user", content: "write a haiku about ai" }],
});
console.log(completion.data.choices[0].message.content);
