This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

## Live deployment:
Visit: https://scriptorium.henrytchen.com/

-----

## Deploying this project locally:

#### Linux
- The abouve documentation has been tailored for linux users (we've tested it on Ubuntu)

#### Notes for Windows Users:
- We recommend running this in WSL (Linux) with docker preconfigured for WSL: https://learn.microsoft.com/en-us/windows/wsl/tutorials/wsl-containers
- IF you receive errors when running startup.sh or run.sh, try using "sed -i -e 's/\r$//' startup.sh" as windows uses CR and LF as line encoding when saving file which is not compatible with linux
- Try running npm rebuild and npm install in the console

