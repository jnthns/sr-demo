# Fake Domain Setup for Amplitude Web Experiment

Amplitude Web Experiment requires a real domain (not localhost) to function properly. This guide explains how to set up a fake domain for local development.

## Setup Instructions

### 1. Add Domain to /etc/hosts

Add the following line to your `/etc/hosts` file to map `sr-demo.local` to localhost:

**On macOS/Linux:**
```bash
sudo nano /etc/hosts
```

Add this line:
```
127.0.0.1    sr-demo.local
```

**On Windows:**
1. Open Notepad as Administrator
2. Open `C:\Windows\System32\drivers\etc\hosts`
3. Add this line:
```
127.0.0.1    sr-demo.local
```

### 2. Run the Development Server

The `package.json` has been configured to use `sr-demo.local` as the hostname:

```bash
npm run dev
```

### 3. Access the Application

Open your browser and navigate to:
```
http://sr-demo.local:3000
```

**Note:** Make sure to use `http://sr-demo.local:3000` instead of `http://localhost:3000` for Amplitude Web Experiment to work correctly.

## Why This Is Needed

Amplitude Web Experiment script requires a real domain name to function properly. Using `localhost` can cause issues with:
- Cookie handling
- Domain-based targeting
- Cross-origin policies
- Experiment configuration

Using a fake domain like `sr-demo.local` allows the Web Experiment script to work correctly while still running locally.

## Troubleshooting

If you encounter issues:

1. **DNS not resolving**: Make sure you've added the entry to `/etc/hosts` and saved the file
2. **Port conflicts**: If port 3000 is in use, Next.js will automatically use the next available port
3. **Permission errors**: On macOS/Linux, you may need to use `sudo` to edit `/etc/hosts`
4. **Browser cache**: Clear your browser cache or use an incognito/private window
