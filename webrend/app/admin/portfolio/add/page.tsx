import { verifyUser } from "../../../utils/auth-utils";
import { redirect } from 'next/navigation';
import AddProjectForm from "./components/AddProjectForm";

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
    <main style={{ padding: '2rem' }}>
      <h1>Add New Portfolio Project</h1>
      <p>Welcome, Admin! Use the form below to add a new project.</p>
      <AddProjectForm />
    </main>
  );
} 