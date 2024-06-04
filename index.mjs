#!/usr/bin/env node
import { GoogleGenerativeAI,  HarmCategory,
  HarmBlockThreshold } from "@google/generative-ai";
import dotenv from "dotenv";
import { execSync} from "child_process";
import { confirm } from '@clack/prompts';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY; // Replace with your actual API key
const systemMessage = `You are a commit message generator create a commit message in english based on their staged git diff, this is the schema:

---
<emoji> <type>(<scope>): <subject>
<body>
---

Do not use any markdown to create commit message, just plain text, don't forget to always use <emoji>, with allowed <type> values are feat, fix, perf, docs, style, refactor, test, and build. `;
const genAI = new GoogleGenerativeAI(API_KEY);


async function run() {
  try {

    execSync(`git add -A`);
    const diffString = execSync(`git diff --staged`).toString();
    
    if (!diffString.trim()) {
      throw { status: 5001, message: "No changes to commit" };
    }
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest",
    systemInstruction: systemMessage
  }
    , { apiVersion: 'v1beta' });
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
       
      ],
    });
  
    
    const result = await chatSession.sendMessage(execSync(`git diff --staged`).toString());
    
    

    const text = result.response.text();
    
 
    let text2=text.replace(/```/g, '');
    let text3=text2.replace(/---/g, '')
    let text4=text3.replace(/\"/gi, "\\\"")
    let text5=text4.replace(/\`/gi, "\\`");
    let text6=text5.replace(/\'/gi, "\\'");
   console.log(text)
  // console.log(diffString.trim())
    const wantCommit = await confirm({
      message: 'want to commit?',
    });
    if(!wantCommit){
      // execSync(`git add -A`);
      execSync(`git reset`);
      process.exit()
    }
    const shouldCommit = await confirm({
      message: 'commit only?',
    });
    if(shouldCommit){
      // execSync(`git add -A`);
      execSync(`printf "${text6}" | git commit -F-`);
      process.exit()
    }
    const shouldContinue = await confirm({
      message: 'Do you want to push?',
    });
    if(shouldContinue){
      // execSync(`git add -A`);
      execSync(`printf "${text6}" | git commit -F-`);
      execSync("git push -u origin main");
    }else{
      execSync(`git reset`);
    }

    process.exit();
  } catch (e) {
    console.log(e.message);
    execSync(`git reset`);
    process.exit();
  }
}

run();
