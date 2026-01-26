import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Redirigir según el rol del usuario
  switch (session.user.role) {
    case "ADMIN":
      redirect("/dashboard");
    case "PUERTA":
      redirect("/puerta");
    case "PRODUCCION":
      redirect("/produccion");
    case "FINANZAS":
      redirect("/finanzas");
    case "TRABAJADOR":
      redirect("/trabajador");
    default:
      redirect("/auth/login");
  }
}
