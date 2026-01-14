import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          {...register('email', { required: 'Email is required' })}
          type="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          {...register('password', { required: 'Password is required' })}
          type="password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};