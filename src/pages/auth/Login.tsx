import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLogin } from '../../hooks';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Ingrese un correo electrónico válido')
    .required('El correo electrónico es obligatorio'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es obligatoria'),
}).required();

type LoginFormInputs = yup.InferType<typeof loginSchema>;

export function Login() {
  const { mutateAsync: loginMutate, isPending } = useLogin();
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginSchema) as any,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError(null);
    try {
      await loginMutate({ email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Error de inicio de sesión. Verifique los datos.');
    }
  };

  return (
    <div className="bg-surface-lowest p-8 rounded-2xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] space-y-6 animate-in fade-in duration-300">
      <header className="space-y-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-on-surface">Bienvenido de nuevo</h2>
        <p className="text-sm font-semibold text-on-surface-variant">Inicie sesión para gestionar sus cosechas</p>
      </header>

      {authError && (
        <div className="bg-error-container text-error-custom p-4 rounded-xl flex items-start gap-2 text-sm font-bold border border-error-custom/10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          placeholder="nombre@finca.com"
          icon={<Mail className="w-5 h-5" />}
          error={errors.email?.message}
          disabled={isPending}
          {...register('email')}
        />

        <Input
          id="password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
          error={errors.password?.message}
          disabled={isPending}
          {...register('password')}
        />

        {/* Remember / Device flag */}
        <div className="flex items-center gap-2 py-1 select-none cursor-pointer">
          <input
            id="remember"
            type="checkbox"
            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container focus:ring-4 cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm font-semibold text-on-surface-variant cursor-pointer">
            Recordar este dispositivo
          </label>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isPending}
          icon={<LogIn className="w-5 h-5" />}
        >
          Iniciar Sesión
        </Button>
      </form>

      {/* Social options */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-outline-variant/30" />
          <span className="text-xs font-bold text-outline uppercase tracking-wider">o continuar con</span>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              // Direct login simulation for testing
              const email = 'agricultor@campo.com';
              const password = 'password123';
              loginMutate({ email, password }).then(() => navigate('/dashboard'));
            }}
            className="flex items-center justify-center gap-2 h-12 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container text-sm font-bold transition-all cursor-pointer"
          >
            <span className="text-primary font-extrabold text-sm font-sans">AgriDemo</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-12 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container text-sm font-bold transition-all cursor-pointer opacity-70"
            disabled
          >
            <span className="material-symbols-outlined text-[18px]">agriculture</span>
            <span>AgriPass</span>
          </button>
        </div>
      </div>

      <footer className="text-center pt-2 border-t border-outline-variant/20">
        <p className="text-sm font-semibold text-on-surface-variant">
          ¿No tiene cuenta?{' '}
          <span className="text-primary hover:underline font-bold cursor-pointer">
            Contacte a administración
          </span>
        </p>
      </footer>
    </div>
  );
}
