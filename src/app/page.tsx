"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { generateQuestionSuggestions } from "@/ai/flows/generate-question-suggestions";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isLoading, setIsLoading] = useState(false);
  const [questionSuggestions, setQuestionSuggestions] = useState<string[]>([]);

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
        await generateSuggestions(dataUri); // Await the completion of generateSuggestions
        toast({
          title: "Success",
          description: "File uploaded successfully and suggestions generated.",
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


  const generateSuggestions = useCallback(
    async (dataUri: string) => {
      try {
        const base64String = dataUri.split(",")[1];
        const decodedPdf = atob(base64String);

        let pdfText = "";
        for (let i = 0; i < decodedPdf.length; i++) {
          pdfText += String.fromCharCode(decodedPdf.charCodeAt(i));
        }

        if (!pdfText) {
          throw new Error("Could not extract text from PDF.");
        }

        const suggestions = await generateQuestionSuggestions({
          documentText: pdfText,
        });
        setQuestionSuggestions(suggestions.suggestions);
        toast({
          title: "Suggestions Generated",
          description: "Successfully generated question suggestions.",
        });
      } catch (error: any) {
        console.error("Error generating suggestions:", error);
        toast({
          title: "Error generating suggestions",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    []
  );

  const askQuestion = async (question: string) => {
    if (!pdfDataUri) {
      toast({
        title: "Error",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setChatHistory((prev) => [...prev, { type: "user", message: question }]);

    try {
      const response = await answerQuestionsFromDocument({
        documentDataUri: pdfDataUri,
        question: question,
      });

      setChatHistory((prev) => [
        ...prev,
        { type: "ai", message: response.answer },
      ]);
    } catch (error: any) {
      console.error("Error asking question:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await askQuestion(values.question);
    form.reset();
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue("question", suggestion);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-docuchat-blue text-primary-foreground p-6 shadow-md">
        <h1 className="text-3xl font-semibold text-center">DocuChat AI</h1>
        <p className="text-sm text-center mt-2">
          Upload a PDF and ask questions!
        </p>
      </header>

      <main className="container mx-auto p-4 flex flex-col flex-grow">
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold">Upload PDF</h2>
            <p className="text-sm text-muted-foreground">
              Upload a PDF document to start chatting with AI.
            </p>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        <Card className="flex-grow">
          <CardHeader>
            <h2 className="text-lg font-semibold">Chat</h2>
            <p className="text-sm text-muted-foreground">
              Ask questions related to the uploaded PDF.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <ScrollArea className="flex-grow mb-4">
              <div className="space-y-2">
                {chatHistory.map((chat, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      chat.type === "user"
                        ? "bg-secondary text-secondary-foreground self-end"
                        : "bg-accent text-accent-foreground self-start"
                    }`}
                  >
                    {chat.message}
                  </div>
                ))}
                {isLoading && (
                  <div className="p-3 rounded-lg bg-accent text-accent-foreground self-start">
                    Thinking...
                  </div>
                )}
              </div>
            </ScrollArea>

            {questionSuggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium">Suggestions:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {questionSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 pb-12">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ask your question here..."
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Ask"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-secondary text-secondary-foreground p-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} DocuChat AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
