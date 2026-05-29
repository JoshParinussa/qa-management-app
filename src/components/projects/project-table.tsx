import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectRow = {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "ARCHIVED";
};

export function ProjectTable({ projects }: { projects: ProjectRow[] }) {
  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada project. Buat project pertama.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell className="text-muted-foreground">{project.code}</TableCell>
            <TableCell>
              <Badge variant={project.status === "ACTIVE" ? "secondary" : "outline"}>
                {project.status === "ACTIVE" ? "Active" : "Archived"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/projects/${project.id}`} className="font-medium text-foreground hover:underline">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
