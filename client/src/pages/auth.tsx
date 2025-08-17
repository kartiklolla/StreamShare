import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, UserPlus, LogIn, Coins, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, loginSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AnimatedLogo from "@/components/animated-logo";
import { z } from "zod";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      isCreator: false,
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    const success = await login(values.username, values.password);
    if (success) {
      setLocation("/");
    }
  };

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    const success = await register(values);
    if (success) {
      setLocation("/");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const formVariants = {
    hidden: { opacity: 0, x: isLogin ? -50 : 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        damping: 20, 
        stiffness: 300 
      }
    },
    exit: { 
      opacity: 0, 
      x: isLogin ? 50 : -50,
      transition: { duration: 0.2 }
    },
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-electric-blue/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-vibrant-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-1s" }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <AnimatedLogo />
          <p className="text-gray-400 mt-4">
            {isLogin ? "Welcome back to the future of streaming" : "Join the next generation of creators"}
          </p>
        </motion.div>

        {/* Auth Card */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect border-electric-blue/30 neon-glow">
            <CardHeader>
              <CardTitle className="text-center">
                <div className="flex justify-center space-x-4 mb-4">
                  <Button
                    onClick={() => setIsLogin(true)}
                    variant="ghost"
                    className={`px-6 py-2 ${
                      isLogin 
                        ? "text-electric-blue border-b-2 border-electric-blue" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => setIsLogin(false)}
                    variant="ghost"
                    className={`px-6 py-2 ${
                      !isLogin 
                        ? "text-electric-blue border-b-2 border-electric-blue" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue"
                                  placeholder="Enter your username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type={showPassword ? "text" : "password"}
                                    className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue pr-10"
                                    placeholder="Enter your password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          className="w-full btn-neon"
                          disabled={loginForm.formState.isSubmitting}
                        >
                          {loginForm.formState.isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                          )}
                          Sign In
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue"
                                  placeholder="Choose a username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue"
                                  placeholder="Enter your email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type={showPassword ? "text" : "password"}
                                    className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue pr-10"
                                    placeholder="Create a password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="bg-dark-bg border-electric-blue/30 focus:border-electric-blue pr-10"
                                    placeholder="Confirm your password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="isCreator"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-electric-blue/30 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="border-electric-blue/50 data-[state=checked]:bg-electric-blue"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center space-x-2">
                                  <Video className="h-4 w-4 text-vibrant-purple" />
                                  <span>I want to be a creator</span>
                                </FormLabel>
                                <p className="text-sm text-gray-400">
                                  Enable creator features to start your own streams
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          className="w-full btn-neon"
                          disabled={registerForm.formState.isSubmitting}
                        >
                          {registerForm.formState.isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          Create Account
                        </Button>
                      </form>
                    </Form>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Welcome Features */}
        <motion.div variants={itemVariants} className="mt-8">
          <Card className="glass-effect border-electric-blue/20">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold gradient-text mb-4 text-center">
                Welcome to StreamShare
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-3">
                  <Coins className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium">100 Free Coins</div>
                    <div className="text-gray-400">Start watching streams immediately</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Video className="h-5 w-5 text-electric-blue flex-shrink-0" />
                  <div>
                    <div className="font-medium">HD Streaming</div>
                    <div className="text-gray-400">Crystal clear video quality</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
