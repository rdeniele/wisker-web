"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { noteContent } from "@/lib/data/subjects";
import QuizSetup, { QuizConfig } from "./components/QuizSetup";
import QuizPlay from "./components/QuizPlay";
import QuizResults from "./components/QuizResults";

interface QuizPageProps {
  params: Promise<{ id: string; noteId: string }>;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Mock quiz data - in production, this would be generated from the note content
const mockQuizData: { [key: string]: QuizQuestion[] } = {
  "1-1": [
    {
      id: 1,
      question: "What is the primary purpose of React components?",
      options: [
        "To style web pages",
        "To build reusable UI elements",
        "To manage databases",
        "To handle server requests",
      ],
      correctAnswer: 1,
      explanation: "React components are designed to build reusable, composable UI elements that can be combined to create complex user interfaces.",
    },
    {
      id: 2,
      question: "Which hook is used to manage state in functional components?",
      options: ["useEffect", "useState", "useContext", "useReducer"],
      correctAnswer: 1,
      explanation: "The useState hook is the primary way to add state to functional components in React.",
    },
    {
      id: 3,
      question: "What does JSX stand for?",
      options: [
        "JavaScript XML",
        "Java Syntax Extension",
        "JavaScript eXtension",
        "JSON XML",
      ],
      correctAnswer: 0,
      explanation: "JSX stands for JavaScript XML, allowing you to write HTML-like syntax in your JavaScript code.",
    },
    {
      id: 4,
      question: "What is the virtual DOM in React?",
      options: [
        "A database for storing component data",
        "A lightweight copy of the actual DOM",
        "A styling framework",
        "A testing library",
      ],
      correctAnswer: 1,
      explanation: "The virtual DOM is a lightweight copy of the actual DOM that React uses to optimize rendering performance.",
    },
    {
      id: 5,
      question: "What is the purpose of useEffect hook?",
      options: [
        "To manage component state",
        "To handle side effects in functional components",
        "To create context providers",
        "To optimize performance",
      ],
      correctAnswer: 1,
      explanation: "useEffect is used to handle side effects like data fetching, subscriptions, or manually changing the DOM.",
    },
    {
      id: 6,
      question: "What is React's reconciliation process?",
      options: [
        "A method to fetch data from APIs",
        "The algorithm React uses to diff and update the DOM",
        "A state management solution",
        "A routing mechanism",
      ],
      correctAnswer: 1,
      explanation: "Reconciliation is React's algorithm for determining what changes need to be made to the DOM.",
    },
    {
      id: 7,
      question: "What are props in React?",
      options: [
        "Properties passed from parent to child components",
        "Internal component state",
        "CSS styling objects",
        "HTTP request parameters",
      ],
      correctAnswer: 0,
      explanation: "Props (properties) are arguments passed into React components, allowing data to flow from parent to child.",
    },
    {
      id: 8,
      question: "What is the difference between state and props?",
      options: [
        "There is no difference",
        "State is mutable within a component, props are immutable",
        "Props can change, state cannot",
        "Both are the same concept with different names",
      ],
      correctAnswer: 1,
      explanation: "State is managed within a component and can change, while props are passed from parent components and cannot be modified by the child.",
    },
    {
      id: 9,
      question: "What is a Higher-Order Component (HOC)?",
      options: [
        "A component that renders at the top of the page",
        "A function that takes a component and returns a new component",
        "A component with high performance",
        "A component with multiple children",
      ],
      correctAnswer: 1,
      explanation: "A HOC is a function that takes a component and returns a new component with additional props or behavior.",
    },
    {
      id: 10,
      question: "What is the Context API used for?",
      options: [
        "Managing routing",
        "Sharing state across components without prop drilling",
        "Styling components",
        "Making HTTP requests",
      ],
      correctAnswer: 1,
      explanation: "The Context API provides a way to pass data through the component tree without having to pass props down manually at every level.",
    },
    {
      id: 11,
      question: "What is React.memo()?",
      options: [
        "A hook for storing data",
        "A higher-order component that memoizes a component",
        "A state management library",
        "A routing function",
      ],
      correctAnswer: 1,
      explanation: "React.memo() is a HOC that prevents unnecessary re-renders by memoizing the result based on props.",
    },
    {
      id: 12,
      question: "What is the purpose of keys in React lists?",
      options: [
        "To encrypt data",
        "To help React identify which items have changed",
        "To style list items",
        "To sort the list",
      ],
      correctAnswer: 1,
      explanation: "Keys help React identify which items in a list have changed, been added, or removed, improving performance.",
    },
    {
      id: 13,
      question: "What is a controlled component?",
      options: [
        "A component with restricted access",
        "A form element whose value is controlled by React state",
        "A component that controls other components",
        "A component with no props",
      ],
      correctAnswer: 1,
      explanation: "A controlled component is a form element whose value is controlled by React state, making React the 'single source of truth'.",
    },
    {
      id: 14,
      question: "What is the useCallback hook used for?",
      options: [
        "To make API calls",
        "To memoize callback functions",
        "To manage component lifecycle",
        "To handle errors",
      ],
      correctAnswer: 1,
      explanation: "useCallback returns a memoized version of a callback function that only changes if dependencies change, optimizing performance.",
    },
    {
      id: 15,
      question: "What is React.Fragment?",
      options: [
        "A broken component",
        "A way to group multiple elements without adding extra nodes to the DOM",
        "A styling component",
        "A routing component",
      ],
      correctAnswer: 1,
      explanation: "React.Fragment allows you to group multiple children elements without adding an extra DOM node.",
    },
    {
      id: 16,
      question: "What is the purpose of useRef?",
      options: [
        "To reference API endpoints",
        "To persist values between renders without causing re-renders",
        "To manage global state",
        "To handle routing",
      ],
      correctAnswer: 1,
      explanation: "useRef creates a mutable reference that persists across renders without triggering re-renders when updated.",
    },
    {
      id: 17,
      question: "What are React portals?",
      options: [
        "Navigation routes",
        "A way to render children into a DOM node outside the parent hierarchy",
        "State management tools",
        "API connectors",
      ],
      correctAnswer: 1,
      explanation: "Portals provide a way to render children into a DOM node that exists outside the parent component's DOM hierarchy.",
    },
    {
      id: 18,
      question: "What is lazy loading in React?",
      options: [
        "Slow component rendering",
        "Dynamically importing components only when needed",
        "Delaying state updates",
        "Loading CSS files",
      ],
      correctAnswer: 1,
      explanation: "Lazy loading allows you to split your code and load components only when they're needed, improving initial load time.",
    },
    {
      id: 19,
      question: "What is the useMemo hook?",
      options: [
        "A hook for form validation",
        "A hook that memoizes expensive computations",
        "A hook for API calls",
        "A hook for managing refs",
      ],
      correctAnswer: 1,
      explanation: "useMemo memoizes the result of expensive computations and only recalculates when dependencies change.",
    },
    {
      id: 20,
      question: "What is prop drilling?",
      options: [
        "A performance optimization technique",
        "Passing props through multiple component levels",
        "A debugging method",
        "A testing strategy",
      ],
      correctAnswer: 1,
      explanation: "Prop drilling refers to passing props through multiple levels of components to reach a deeply nested component.",
    },
  ],
};

type QuizState = "setup" | "playing" | "results";

export default function QuizPage({ params }: QuizPageProps) {
  const { id, noteId } = use(params);
  const router = useRouter();
  const noteKey = `${id}-${noteId}`;
  const note = noteContent[noteKey];

  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [, setQuizConfig] = useState<QuizConfig | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const handleStartQuiz = (config: QuizConfig) => {
    setQuizConfig(config);
    
    // Get all available questions
    const allQuestions = mockQuizData[noteKey] || mockQuizData["1-1"];
    
    // Shuffle and select the requested number of questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(config.numberOfQuestions, allQuestions.length));
    
    setQuizQuestions(selected);
    setQuizState("playing");
  };

  const handleQuizComplete = (score: number) => {
    setFinalScore(score);
    setQuizState("results");
  };

  const handleRetake = () => {
    setQuizState("setup");
    setQuizConfig(null);
    setFinalScore(0);
    setQuizQuestions([]);
  };

  const handleBackToNote = () => {
    router.back();
  };

  // Render based on quiz state
  if (quizState === "setup") {
    return (
      <QuizSetup
        noteTitle={note?.title || "Your Note"}
        onStart={handleStartQuiz}
        onBack={handleBackToNote}
      />
    );
  }

  if (quizState === "results") {
    return (
      <QuizResults
        score={finalScore}
        totalQuestions={quizQuestions.length}
        noteTitle={note?.title || "Your Note"}
        onRetake={handleRetake}
        onBackToNote={handleBackToNote}
      />
    );
  }

  // Playing state
  return (
    <QuizPlay
      questions={quizQuestions}
      noteTitle={note?.title || "Your Note"}
      onBack={handleBackToNote}
      onComplete={handleQuizComplete}
    />
  );
}
