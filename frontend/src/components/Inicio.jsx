import React, { useState } from 'react';
import './Inicio.css';
import heroVideo from '../assets/Video_Generado_con_Orientación.mp4';
import logoOrientarso from '../assets/logo.orientarso-removebg-preview.png';
import gridIcon from '../assets/grid-3x2-gap-fill.svg';
import imgAutoconocimiento from '../assets/Gemini_Generated_Image_o3b6wo3b6wo3b6wo.png';
import imgResultados from '../assets/unnamed (1).jpg';
import imgExplora from '../assets/unnamed.jpg';
import Login from './Login';
import Registro from './Registro';

function Inicio() {
  const [modalImage, setModalImage] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openModal = (image) => setModalImage(image);
  const closeModal = () => setModalImage(null);
  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);
  const openSignup = () => setIsSignupOpen(true);
  const closeSignup = () => setIsSignupOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);
  return (
    <>

export default Inicio;
