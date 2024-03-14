#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { execSync, spawn } from "child_process";
import { confirm } from '@clack/prompts';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY; // Replace with your actual API key
const systemMessage = `You are a commit message generator create a commit message in english by their diff string, 
you don't need to explain anything just put the commit message, first "<subject>" and "<body>" always in english, this is the schema:

---
<emoji> <type>(<scope>): <subject>
<body>

Indonesian translation:

<emoji> <type>(<scope>): <subject>
<body>
---

With allowed <type> values are feat, fix, perf, docs, style, refactor, test, and build. After creating commit message, translate the commit message to indonesian language and put it below \`Indonesian translation:\` text. And here's an example of a good commit message:

---
📝 docs(README): Add web demo and Clarifai project.
Adding links to the web demo and Clarifai project page to the documentation. Users can now access the GPT-4 Turbo demo application and view the Clarifai project through the provided links.

Indonesian translation:

📝 docs(README): tambah demo web dan proyek Clarifai.
Menambahkan tautan demo web dan halaman proyek Clarifai ke dalam dokumentasi. Pengguna kini dapat mengakses demo aplikasi GPT-4 Turbo dan melihat proyek Clarifai melalui tautan yang disediakan.
---

create commit message from this git diff:`;
const genAI = new GoogleGenerativeAI(API_KEY);

async function gitDiffStaged() {
  const child = spawn("git", ["diff", "--staged"]);

  const output = await new Promise((resolve, reject) => {
    let stdout = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Git command failed with exit code ${code}`));
      }
    });
    child.stderr.on("data", (data) => {
      console.error(data.toString());
    });
  });

  return output;
}
async function run() {
  try {
    execSync(`#!/bin/bash

    # Find the first changed file using git status
    first_changed_file=$(git status --porcelain | awk '{print $2}' | head -n 1)
    
    # Check if a file was found
    if [ -z "$first_changed_file" ]; then
        echo "No changed files found."
        exit 1
    fi
    
    # Add the first changed file to staging
    git add "$first_changed_file"`);
    const diffString = await gitDiffStaged();
    if (!diffString.trim()) {
      throw { status: 5001, message: "No changes to commit" };
    }
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let modifiedDiffString = diffString;
    let modifiedPrompt = `${systemMessage}
        ${modifiedDiffString}
        `;
    // console.log(modifiedPrompt)
    const result = await model.generateContent(modifiedPrompt);
    const response = await result.response;
    const text = response.text();
    let text2=text.replace(/```/g, '');
    let text3=text2.replace(/---/g, '')
    let text4=text3.replace(/\"/gi, "\\\"")
    let text5=text4.replace(/\`/gi, "\\`");
    let text6=text5.replace(/\'/gi, "\\'");
    console.log(text6)


    const shouldContinue = await confirm({
      message: 'Do you want to push?',
    });
    if(shouldContinue){
      execSync(`git add -A`);
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
