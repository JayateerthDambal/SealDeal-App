
# Firebase Setup Guide

Follow these steps to connect the application to your new Firebase project.

### Step 3: Get Your Firebase Project Configuration

Now that you have a project, you need to create a Web App entry within it to get the configuration keys that your frontend will use to connect to Firebase.

1.  In the Firebase Console, on your new project's overview page, click the **web icon** ( `</>` ) to start the "Add an app" workflow.
2.  Give your app a nickname (e.g., "SealDeal Frontend") and click **"Register app"**.
3.  On the next screen, you will see an `npm` tab and a `config` object. **Copy the entire `firebaseConfig` object**. It will look something like this:

    ```javascript
    const firebaseConfig = {
      apiKey: "AIza....",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "...",
      appId: "..."
    };
    ```

### Step 4: Update the Frontend Code

1.  Open the file `src/firebase.ts` in your code editor.
2.  Replace the existing `firebaseConfig` object with the one you just copied from the Firebase Console.

### Step 5: Update the Project ID

1.  Open the `.firebaserc` file in your code editor.
2.  Replace `sunlit-setup-470516-q3` with your new **Project ID**.

    ```json
    {
      "projects": {
        "default": "your-new-project-id"
      }
    }
    ```

### Step 6: Log in to the Firebase CLI

Now, authenticate the Firebase CLI with your Google account.

Run the following command in your terminal:

```bash
firebase login
```

This will open a browser window for you to log in.

### Step 7: Enable Firestore and Storage

Before you can deploy, you need to activate the Firestore database and Cloud Storage in your new project.

1.  In the Firebase Console, go to the **"Build"** section in the left-hand menu.
2.  Click on **"Firestore Database"**.
3.  Click **"Create database"**.
4.  Choose to start in **Test mode** for now. This will allow you to read and write freely during development. Click **"Next"**.
5.  Choose a location for your database and click **"Enable"**.
6.  Go back to the **"Build"** section and click on **"Storage"**.
7.  Click **"Get started"** and follow the prompts, accepting the default security rules for now.

### Step 8: Deploy Your Firebase Rules

Finally, deploy the configuration for Hosting, Functions, Firestore, and Storage to your new project.

Run the following command in your terminal:

```bash
firebase deploy
```

Once this is complete, your project will be fully configured and connected to your own Firebase backend.
