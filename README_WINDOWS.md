# Hosting on Windows Server 2019 Datacenter

This guide explains how to host this application on your Windows Server 2019 environment.

## Prerequisites

1.  **Node.js**: Download and install the latest LTS version from [nodejs.org](https://nodejs.org/). (Version 22+ recommended).
2.  **Git**: (Optional) For cloning the repository.
3.  **Firebase Config**: Ensure `firebase-applet-config.json` is in the root directory.

## Deployment Steps

### 1. Prepare the Files
*   Export the project from AI Studio (Settings -> Export to ZIP).
*   Extract the ZIP file to a folder on your server (e.g., `C:\inetpub\padma-id-manager`).

### 2. Install Dependencies and Build
Open PowerShell or Command Prompt as Administrator, navigate to the folder, and run:

```powershell
# Install dependencies
npm install

# Build the frontend
npm run build
```

### 3. Run the Application
You can start the app manually to test:

```powershell
npm start
```

The app will be accessible at `http://localhost:3000`.

## Running as a Background Service (Recommended)

To ensure the app stays running after you close the terminal or if the server restarts, use **PM2**.

1.  **Install PM2 globally**:
    ```powershell
    npm install pm2 -g
    ```

2.  **Start the app with PM2**:
    ```powershell
    pm2 start "npm start" --name "padma-id-manager"
    ```
    *Note: This runs the npm start script which handles the environment variables and TypeScript execution.*

3.  **Set up auto-start on reboot**:
    ```powershell
    npm install pm2-windows-startup -g
    pm2-startup install
    pm2 save
    ```

## Using IIS as a Reverse Proxy (Optional)

If you want to use your server's domain (e.g., `http://id.yourcompany.com`) and standard port 80/443:

1.  Install **Application Request Routing (ARR)** and **URL Rewrite** modules in IIS.
2.  Create a new Website in IIS.
3.  Add a `web.config` file to your project root with a rewrite rule to forward traffic to `http://localhost:3000`.

## Troubleshooting

*   **Port 3000 Blocked**: Ensure you have added an Inbound Rule in **Windows Firewall** to allow traffic on port 3000.
*   **Permissions**: Ensure the user running the Node.js process has read/write permissions to the application folder.
*   **ZKTeco Integration**: If your fingerprint devices are on a different VLAN, ensure the Windows Server routing allows communication to the device IPs.
