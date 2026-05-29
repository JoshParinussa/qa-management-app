import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  assignmentRole: "QA_MEMBER" | "QA_PIC";
};

type ProjectMemberTableProps = {
  members: MemberRow[];
  canManage: boolean;
  removeAction?: (formData: FormData) => void;
};

export function ProjectMemberTable({ members, canManage, removeAction }: ProjectMemberTableProps) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada member ter-assign.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          {canManage ? <TableHead className="text-right">Action</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell className="text-muted-foreground">{member.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{member.assignmentRole === "QA_PIC" ? "QA PIC" : "QA Member"}</Badge>
            </TableCell>
            {canManage ? (
              <TableCell className="text-right">
                <form action={removeAction}>
                  <input type="hidden" name="userId" value={member.userId} />
                  <Button type="submit" variant="ghost" size="sm">Remove</Button>
                </form>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
