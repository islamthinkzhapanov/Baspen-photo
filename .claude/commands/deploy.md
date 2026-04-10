Commit all current changes and deploy to the production server. Follow these steps exactly:

## Step 1: Commit all changes

1. Run `git status` to see all changes
2. Run `git diff` and `git diff --staged` to understand what changed
3. Run `git log --oneline -5` to match commit message style
4. Stage ALL changed and untracked files (except .env*, node_modules, .next)
5. Write a concise commit message summarizing the changes
6. Commit with Co-Authored-By trailer

## Step 2: Push to remote

1. Push to `origin main`

## Step 3: Deploy to Hetzner server

1. SSH into the server and pull + rebuild:

```bash
ssh -i ~/.ssh/hetzner baspen@204.168.229.127 "cd ~/app && git pull origin main && docker compose -f docker-compose.prod.yml build app worker && docker compose -f docker-compose.prod.yml up -d app worker"
```

2. Verify the deploy succeeded by checking container status:

```bash
ssh -i ~/.ssh/hetzner baspen@204.168.229.127 "docker compose -f docker-compose.prod.yml ps"
```

3. Report the result: which containers are running and their status.
