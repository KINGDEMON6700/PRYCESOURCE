import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsContext";

import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import ProductDetail from "@/pages/ProductDetail";
import AllProducts from "@/pages/AllProducts";
import AllStores from "@/pages/AllStores";
import StoreDetail from "@/pages/StoreDetail";
import StoreProducts from "@/pages/StoreProducts";
import Map from "@/pages/Map";
import Contribute from "@/pages/Contribute";
import Report from "@/pages/Report";
import Profile from "@/pages/Profile";
import Alerts from "@/pages/Alerts";
import Insights from "@/pages/Insights";
import AdminPanel from "@/pages/AdminPanel";
import ShoppingListPage from "@/pages/ShoppingListPage";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/products" component={AllProducts} />
          <Route path="/stores" component={AllStores} />
          <Route path="/stores/:id" component={StoreDetail} />
          <Route path="/stores/:id/products" component={StoreProducts} />
          <Route path="/map" component={Map} />
          <Route path="/contribute" component={Contribute} />
          <Route path="/report" component={Report} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/insights" component={Insights} />
          <Route path="/shopping-list" component={ShoppingListPage} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin" component={AdminPanel} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleMapsProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </GoogleMapsProvider>
    </QueryClientProvider>
  );
}

export default App;
