![image](https://github.com/user-attachments/assets/e8cc28fc-0370-46ec-a74f-cbc6a849fe1d)

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).


## What is this project?

An online platform where you can write, execute, and share code in multiple programming languages (you can support more languages in your own deployment easily). Inspired by the ancient concept of a scriptorium, a place where manuscripts were crafted and preserved, Scriptorium modernizes this idea for the digital age. It offers a secure environment for geeks, nerds, and coding enthusiasts to experiment, refine, and save their work as reusable templates. Whether you’re testing a quick snippet or building a reusable code example, Scriptorium is what you need to bring your ideas to life.

## Key features:
- Online code execution: Quickly test out any publicly available code template on the platform (in a Dockerised setting, so no naughty business!).
- Create, edit, save, and share your own code templates, with built in language specific syntax highlighting.
- Web forum where you can blog about your creations, and comment on other's work.
- Like a template? You can easily Fork your own instance and start building from there.
- For platform Administrators, a simple yet powerful moderation toolkit is available out of the box.
- All delivered in a seamless, user-friendly Next.js project using Prisma ORM and REST API framework that is easily customizable.


## Getting Started 
#### (For full guide, jump down to [Deploying this Project Locally](#Deploying-this-project-locally)

First, run the startup file:

```bash

bash startup.sh
```

Then run the run.sh file

```bash
bash run.sh
```

This should start the next server

You can veryify this by opening: [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To verify everything is running correctly, consider running in a new terminal the test suite:

```bash

npx jest

```

## Usage
Default Admin details:
### username: SUDOMASTER
### password: SUDOMaSTER123$$$

UML diagram of our model is available in prisma-UML.png

Use our provided postman collection (see sciptorium.post_collection) to test the available API endpoints! That's all. 

## Live deployment (Demo):
Visit: https://scriptorium.henrytchen.com/ 

#### Note that the demo-site is currently using http, so you might recieve a warning popup that you will have to "procceed" with!
-----

## Deploying this project locally:
1) Ensure that your system has [node](https://nodejs.org/en/download/package-manager) installed (we also recommend using linux).
2) Ensure that your system has docker installed and set up (nesscary for code execution).
3) Download the source files into a folder of your choice.
4.1) Open this folder in your code editor of choice (we recommend Visual Studio Code).
4.2) Alternatively, in the terminal of choice, navigate (i.e cd) to the folder.
5) Run the startup.sh script.
6) Then run the run.sh script.
7) Finally, in the browser of choice, use the URL: [http://localhost:3000](http://localhost:3000).
8) You should see a deployment of the project!
9) The preconfigured Admin Account is found in [Usage](#usage) above.

### Platform Specific Tips:
#### Linux
- The above documentation has been tailored for linux users (we've tested it on Ubuntu).

#### Notes for Windows Users:
- We recommend running this in WSL (Linux) with docker preconfigured for WSL: https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers.
- IF you receive errors when running startup.sh or run.sh, try using "sed -i -e 's/\r$//' startup.sh" as windows uses CR and LF as line encoding when saving file which is not compatible with linux.
- Try running npm rebuild and npm install in the console.

## Deploying this project as a production build:
Simply put, you deploy this project as you would any other Next.js project. However, we suggest (though not required) that you run the startup.sh file first before using 'npm run build' and 'npm start' to ensure the database is pre-populated with a starter admin user and the nesscary docker images are prepped as well!

