"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"; // Asegúrate de que existe este componente

export default function Home() {
  const [projects, setProjects] = useState(["Project A", "Project B", "Project C"]);
  const [documents, setDocuments] = useState(["Document 1", "Document 2", "Document 3"]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [project, setProject] = useState(projects[0]);
  const [document, setDocument] = useState(documents[0]);
  const [hours, setHours] = useState<number | undefined>(8);
  const [description, setDescription] = useState<string | undefined>("");
  const [timeEntries, setTimeEntries] = useState<
    { date: string; project: string; document: string; hours: number; description?: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [timeSummary, setTimeSummary] = useState<{ [project: string]: { [document: string]: number } }>({});
  const [totalHours, setTotalHours] = useState(0);

  const handleSubmit = () => {
    if (!date || !project || !hours || !document) {
      setError("Please fill in all fields.");
      return;
    }

    const newEntry = {
      date: date.toISOString().slice(0, 10),
      project,
      document,
      hours,
      description,
    };

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);

    const newTimeSummary = updatedEntries.reduce((acc: { [project: string]: { [document: string]: number } }, entry) => {
      if (!acc[entry.project]) acc[entry.project] = {};
      acc[entry.project][entry.document] = (acc[entry.project][entry.document] || 0) + entry.hours;
      return acc;
    }, {});

    const newTotalHours = updatedEntries.reduce((acc, entry) => acc + entry.hours, 0);

    setTimeSummary(newTimeSummary);
    setTotalHours(newTotalHours);
    setError(null); // limpiar errores previos
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Entry</CardTitle>
          <CardDescription>Record your time spent on each project.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Calendar
                id="date"
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <select
                id="project"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document">Document/Plan</Label>
              <select
                id="document"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
              >
                {documents.map((document) => (
                  <option key={document} value={document}>
                    {document}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                type="number"
                id="hours"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit}>Add Time Entry</Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Time Summary</CardTitle>
          <CardDescription>Summary of hours worked per project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Document/Plan</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(timeSummary).map(([project, docs]) =>
                Object.entries(docs).map(([doc, hours]) => {
                  const descriptions = timeEntries
                    .filter((entry) => entry.project === project && entry.document === doc)
                    .map((entry) => entry.description)
                    .join(", ");
                  return (
                    <TableRow key={`${project}-${doc}`}>
                      <TableCell>{project}</TableCell>
                      <TableCell>{doc}</TableCell>
                      <TableCell>{hours}</TableCell>
                      <TableCell>{descriptions}</TableCell>
                    </TableRow>
                  );
                })
              )}
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>{totalHours}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
