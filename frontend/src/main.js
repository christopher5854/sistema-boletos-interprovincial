import { estaAutenticado, redirigirSegunRol } from './utils/auth.js';

if (estaAutenticado()) {
    redirigirSegunRol();
}