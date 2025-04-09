
import React, { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Initialize the app when the component mounts
    const scriptElement = document.createElement("script");
    scriptElement.src = "/script.js";
    scriptElement.async = true;
    document.body.appendChild(scriptElement);

    toast({
      title: "Bienvenido a la Cata de Rones",
      description: "Seleccione su rol para comenzar con la experiencia.",
    });

    return () => {
      // Clean up the script when the component unmounts
      if (scriptElement.parentNode) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [toast]);

  return (
    <div className="container">
      {/* The HTML content is already in the index.html file */}
      {/* The app is initialized via the script.js file */}
    </div>
  );
};

export default Index;
