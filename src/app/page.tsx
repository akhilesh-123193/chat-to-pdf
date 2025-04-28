"use client";

import { useState, useRef, useEffect } from "react";
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
  SidebarFooter,
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
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

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
    setUploadedFileName(file.name);

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
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-docuchat-beige-light text-docuchat-gray-dark font-sans">
        {/* Sidebar */}
        <Sidebar className="w-64 border-r border-docuchat-beige-dark flex-shrink-0">
          <SidebarHeader className="text-center font-semibold text-xl py-4">
            DocuChat
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2">
                {chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-2 rounded-md break-words",
                      chat.type === "user"
                        ? "bg-docuchat-medium-beige text-docuchat-gray-dark"
                        : "bg-docuchat-beige-dark text-docuchat-gray-dark"
                    )}
                  >
                    {chat.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SidebarContent>
          <SidebarFooter className="bg-docuchat-beige-medium text-docuchat-gray-dark p-4 text-center rounded-md mt-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} DocuChat. All rights reserved.
            </p>
          </SidebarFooter>
        </Sidebar>

        {/* Main Chat Area */}
        <main className="flex flex-col flex-grow p-4">
          {/* Upload Document Section */}
          <Card className="mb-4 rounded-2xl shadow-md">
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
              {uploadedFileName && (
                <p className="text-sm text-docuchat-gray-warm">
                  Uploaded: {uploadedFileName}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages Area */}
          <ScrollArea className="flex-grow overflow-y-auto mb-4" ref={chatHistoryRef}>
            <div className="flex flex-col space-y-2">
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={cn(
                    "mb-2 p-3 rounded-2xl max-w-2xl break-words",
                    chat.type === "user"
                      ? "bg-docuchat-medium-beige text-docuchat-gray-dark self-end"
                      : "bg-docuchat-beige-dark text-docuchat-gray-dark self-start"
                  )}
                  style={{ alignSelf: chat.type === "user" ? "flex-end" : "flex-start" }}
                >
                  {chat.message}
                </div>
              ))}

              {aiResponse && (
                <Card className="mt-4 rounded-2xl shadow-md max-w-2xl">
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Response</h2>
                  </CardHeader>
                  <CardContent className="bg-docuchat-beige-medium text-docuchat-gray-dark">
                    <p>{aiResponse}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Ask Question Section */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader>
              <h2 className="text-lg font-semibold">Ask Question</h2>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-end">
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Type your question here</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type your question..."
                            className="bg-docuchat-beige-light border-docuchat-beige-dark text-docuchat-gray-dark rounded-2xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="ml-2 docuchat-terracotta rounded-2xl h-11">
                    Ask
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
