"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { answerQuestionsFromDocument } from "@/ai/flows/answer-questions-from-document";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const formSchema = z.object({
  question: z.string().min(2, {
    message: "Question must be at least 2 characters.",
  }),
});

export default function Home() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<
    { type: "user" | "ai"; message: string }[]
  >([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>(""); // Track the current question being typed

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected.",
        variant: "destructive",
      });
      return;
    }

    setPdfFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataUri = event.target?.result as string;
        setPdfDataUri(dataUri);
        toast({
          title: "Success",
          description: "File uploaded successfully.",
        });
      } catch (error: any) {
        console.error("Error during file processing:", error);
        toast({
          title: "Error",
          description: `File upload failed: ${error.message}`,
          variant: "destructive",
        });
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      toast({
        title: "Error",
        description: `Failed to read file: ${error}`,
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const askQuestion = async (question: string) => {
    if (!pdfDataUri) {
      toast({
        title: "Error",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setChatHistory((prev) => [...prev, { type: "user", message: question }]);
    setAiResponse(null);

    try {
      const response = await answerQuestionsFromDocument({
        documentDataUri: pdfDataUri,
        question: question,
      });

      setAiResponse(response.answer);
      setChatHistory((prev) => [...prev, { type: "ai", message: response.answer }]);
    } catch (error: any) {
      console.error("Error asking question:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await askQuestion(values.question);
    form.reset();
    setCurrentQuestion(""); // Clear the current question after submitting
  };

  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-docuchat-beige-light text-docuchat-gray-dark">
        <Sidebar className="w-64 border-r border-docuchat-beige-dark flex-shrink-0">
          <SidebarHeader>
            <h2 className="text-lg font-semibold text-docuchat-gray-dark">Message History</h2>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2">
                {chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded-md",
                      chat.type === "user"
                        ? "bg-docuchat-beige-medium text-docuchat-gray-dark"
                        : "bg-docuchat-beige-dark text-docuchat-gray-dark"
                    )}
                  >
                    {chat.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SidebarContent>
        </Sidebar>

        <main className="flex flex-col flex-grow p-4">
          <header className="bg-docuchat-beige-medium text-docuchat-gray-dark p-6 shadow-md rounded-md mb-4">
            <h1 className="text-3xl font-semibold text-center">DocuChat</h1>
          </header>

          <Card className="mb-4">
            <CardHeader>
              <h2 className="text-lg font-semibold">Upload Document</h2>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="mb-4"
              />
            </CardContent>
          </Card>

          <div className="flex-grow overflow-y-auto">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={cn(
                  "mb-2 p-3 rounded-md",
                  chat.type === "user"
                    ? "bg-docuchat-beige-medium text-docuchat-gray-dark self-end"
                    : "bg-docuchat-beige-dark text-docuchat-gray-dark self-start"
                )}
                style={{maxWidth: '80%', alignSelf: chat.type === "user" ? 'flex-end' : 'flex-start'}}
              >
                {chat.message}
              </div>
            ))}

            {aiResponse && (
              <Card className="mt-4">
                <CardHeader>
                  <h2 className="text-lg font-semibold">Response</h2>
                </CardHeader>
                <CardContent className="bg-docuchat-beige-medium text-docuchat-gray-dark">
                  <p>{aiResponse}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Ask Question</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full">
                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Type your question here</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type your question..."
                              className="bg-docuchat-beige-light border-docuchat-beige-dark text-docuchat-gray-dark"
                              {...field}
                              value={currentQuestion} // Use the currentQuestion state
                              onChange={(e) => {
                                field.onChange(e); // Keep the form state updated
                                setCurrentQuestion(e.target.value); // Update the currentQuestion state
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="ml-2 docuchat-terracotta">
                      Ask
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>

          <footer className="bg-docuchat-beige-medium text-docuchat-gray-dark p-4 text-center rounded-md mt-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} DocuChat. All rights reserved.
            </p>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
