This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load `Open Sans` as the default sans font and `Menlo` as the default monospace font.

## Prisma Database Commands

This project uses [Prisma](https://www.prisma.io/) as the ORM for database management.

### Essential Prisma Commands

```bash
# Create a new migration after schema changes
pnpm prisma migrate dev --name feature_name

# Apply pending migrations
pnpm prisma migrate deploy

# Check migration status
pnpm prisma migrate status

# Reset database (⚠️ Deletes all data)
pnpm prisma migrate reset

# Generate Prisma Client
pnpm prisma generate

# Open Prisma Studio (visual database explorer)
pnpm prisma studio

# Format schema.prisma file
pnpm prisma format

# Validate schema for errors
pnpm prisma validate
```

### Prisma Workflow

1. **Update Schema:** Modify `prisma/schema.prisma`
2. **Create Migration:** `pnpm prisma migrate dev --name descriptive_name`
3. **Generate Client:** Automatically done with migrate dev
4. **View Database:** `pnpm prisma studio` (optional)

### Environment Setup

Ensure `.env.local` contains your database connection:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/job_portal_db"
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
