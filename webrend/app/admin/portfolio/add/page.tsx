import { verifyUser } from "../../../utils/auth-utils";
import { redirect } from 'next/navigation';
import AddProjectForm from "./components/AddProjectForm";
import styles from "../page.module.css";

// This is a server component
export default async function AddPortfolioProjectPage() {
  // Verify user on the server
  const user = await verifyUser();

  // Redirect if not the admin user
  if (user?.email !== 'ceo@webrend.com') {
    console.warn(`Unauthorized access attempt to admin page by user: ${user?.email || 'Guest'}`);
    redirect('/auth?error=unauthorized'); // Redirect to login or show an error
  }

  // If authorized, render the page content
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add Portfolio Project</h1>
      </div>
      <AddProjectForm />
    </main>
  );
} 