-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-09-2025 a las 04:02:56
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `test 1`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `recomendar_carreras` (IN `p_DNI` INT)   BEGIN
    SELECT 
        u.DNI,
        u.Nombre_Usuario,
        a.Nombre_area,
        SUM(o.valor) AS Puntaje_Total,
        c.Nombre_carrera,
        i.Nombre_institu,
        i.Costos,
        i.Becas,
        i.Convenios
    FROM alm_puntaje ap
    JOIN usuario u ON ap.DNI = u.DNI
    JOIN opciones o ON ap.cod_opciones = o.ID_opciones
    JOIN areas a ON ap.cod_area = a.ID_area
    JOIN carreras c ON c.Cod_area = a.ID_area
    JOIN instituto_educacion_superior i ON i.Cod_carreras = c.Cod_carrera
    WHERE u.DNI = p_DNI
    GROUP BY u.DNI, u.Nombre_Usuario, a.Nombre_area, c.Nombre_carrera, 
             i.Nombre_institu, i.Costos, i.Becas, i.Convenios;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alm_puntaje`
--

CREATE TABLE `alm_puntaje` (
  `id_respuesta` int(12) NOT NULL,
  `cod_opciones` int(12) DEFAULT NULL,
  `cod_area` int(12) DEFAULT NULL,
  `cod_preguntas` int(12) DEFAULT NULL,
  `DNI` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alm_puntaje`
--

INSERT INTO `alm_puntaje` (`id_respuesta`, `cod_opciones`, `cod_area`, `cod_preguntas`, `DNI`) VALUES
(2, 3, 1, 2, 1001),
(3, 5, 1, 3, 1001),
(4, 8, 1, 4, 1001),
(5, 10, 1, 5, 1001),
(6, 11, 2, 6, 1001),
(7, 13, 2, 7, 1001),
(8, 16, 2, 8, 1001),
(9, 18, 2, 9, 1001),
(10, 20, 2, 10, 1001),
(11, 21, 3, 11, 1001),
(12, 23, 3, 12, 1001),
(13, 25, 3, 13, 1001),
(14, 27, 3, 14, 1001),
(15, 30, 3, 15, 1001),
(16, 31, 1, 16, 1002),
(17, 33, 1, 17, 1002),
(18, 35, 1, 18, 1002),
(19, 37, 1, 19, 1002),
(20, 39, 1, 20, 1002),
(21, 41, 2, 21, 1002),
(22, 43, 2, 22, 1002),
(23, 45, 2, 23, 1002),
(24, 48, 2, 24, 1002),
(25, 50, 2, 25, 1002),
(26, 52, 3, 26, 1002),
(27, 54, 3, 27, 1002),
(28, 56, 3, 28, 1002),
(29, 57, 3, 29, 1002),
(30, 59, 3, 30, 1002),
(31, 65, 1, 31, 1003),
(32, 63, 1, 32, 1003),
(33, 65, 1, 33, 1003),
(34, 67, 1, 34, 1003),
(35, 69, 1, 35, 1003),
(36, 71, 2, 36, 1003),
(37, 73, 2, 37, 1003),
(38, 75, 2, 38, 1003),
(39, 77, 2, 39, 1003),
(40, 79, 2, 40, 1003),
(41, 82, 3, 41, 1003),
(42, 84, 3, 42, 1003),
(43, 86, 3, 43, 1003),
(44, 88, 3, 44, 1003),
(45, 90, 3, 45, 1003),
(46, 91, 1, 31, 1004),
(47, 93, 1, 32, 1004),
(48, 95, 1, 33, 1004),
(49, 97, 1, 34, 1004),
(50, 99, 1, 35, 1004),
(51, 102, 2, 36, 1004),
(52, 104, 2, 37, 1004),
(53, 106, 2, 38, 1004),
(54, 108, 2, 39, 1004),
(55, 110, 2, 40, 1004),
(56, 112, 3, 41, 1004),
(57, 114, 3, 42, 1004),
(58, 116, 3, 43, 1004),
(59, 118, 3, 44, 1004),
(60, 120, 3, 45, 1004);

--
-- Disparadores `alm_puntaje`
--
DELIMITER $$
CREATE TRIGGER `calcular_puntaje_al_insertar` AFTER INSERT ON `alm_puntaje` FOR EACH ROW BEGIN
    DECLARE total_puntaje INT;
    DECLARE area_id INT;
    DECLARE carrera_id INT;
    
    SELECT SUM(o.valor)
    INTO total_puntaje
    FROM alm_puntaje ap
    JOIN opciones o ON ap.cod_opciones = o.ID_opciones
    WHERE ap.DNI = NEW.DNI;

    SELECT a.ID_area, c.Cod_carrera
    INTO area_id, carrera_id
    FROM alm_puntaje ap
    JOIN areas a ON ap.cod_area = a.ID_area
    JOIN carreras c ON a.ID_area = c.Cod_area
    WHERE ap.DNI = NEW.DNI
    LIMIT 1; 
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `areas`
--

CREATE TABLE `areas` (
  `ID_area` int(12) NOT NULL,
  `Nombre_area` varchar(255) DEFAULT NULL,
  `id_opciones` int(12) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `areas`
--

INSERT INTO `areas` (`ID_area`, `Nombre_area`, `id_opciones`) VALUES
(1, 'Ciencia y Tecnología', NULL),
(2, 'Comunicación y Artes', NULL),
(3, 'Administrativo', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carreras`
--

CREATE TABLE `carreras` (
  `Cod_area` int(11) DEFAULT NULL,
  `Cod_carrera` int(11) NOT NULL,
  `Nombre_carrera` varchar(100) DEFAULT NULL,
  `Descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `carreras`
--

INSERT INTO `carreras` (`Cod_area`, `Cod_carrera`, `Nombre_carrera`, `Descripcion`) VALUES
(1, 1, 'Ingeniería de Sistemas', 'Estudia y desarrolla soluciones tecnológicas'),
(1, 2, 'Física Aplicada', 'Enfocada en la aplicación de principios físicos'),
(2, 3, 'Comunicación Social', 'Forma profesionales en medios y comunicación'),
(2, 4, 'Diseño Gráfico', 'Diseño visual para publicidad y medios digitales'),
(3, 5, 'Administración de Empresas', 'Gestión y organización de empresas'),
(3, 6, 'Contaduría Pública', 'Registro y control financiero y fiscal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `encuestas`
--

CREATE TABLE `encuestas` (
  `Cod_encuestas` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `dni` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `encuestas`
--

INSERT INTO `encuestas` (`Cod_encuestas`, `fecha`, `dni`) VALUES
(1, '2025-07-01', 1001),
(2, '2025-07-02', 1002),
(3, '2025-07-03', 1003),
(4, '2025-07-04', 1004),
(5, '2025-07-05', 1005);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `instituto_educacion_superior`
--

CREATE TABLE `instituto_educacion_superior` (
  `Cod_instituto` int(11) NOT NULL,
  `Nombre_institu` varchar(255) DEFAULT NULL,
  `nombre_carrera` varchar(255) NOT NULL,
  `informacion_requisitos` varchar(255) DEFAULT NULL,
  `Costos` varchar(20) DEFAULT NULL,
  `Direccion` varchar(255) DEFAULT NULL,
  `Cod_carreras` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `instituto_educacion_superior`
--

INSERT INTO `instituto_educacion_superior` (`Cod_instituto`, `Nombre_institu`, `nombre_carrera`, `informacion_requisitos`, `Costos`, `Direccion`, `Cod_carreras`) VALUES
(1, 'Instituto Tecnológico Nacional', '', 'Ofrece programas en tecnología e ingeniería', '3000000', 'Cra 10 #23-45', 1),
(2, 'Instituto de Ciencias Físicas', '', 'Carreras de ciencia pura y aplicada', '2500000', 'Calle 45 #12-34', 2),
(3, 'Escuela de Comunicación Creativa', '', 'Comunicación, publicidad y medios', '2800000', 'Av 9 #22-20', 3),
(4, 'Centro de Diseño Visual', '', 'Diseño gráfico, web y audiovisual', '2600000', 'Calle 30 #7-10', 4),
(5, 'Escuela de Negocios Empresariales', '', 'Administración y economía', '2700000', 'Av 7 #18-50', 5),
(6, 'Instituto de Contabilidad y Finanzas', '', 'Contabilidad, auditoría y finanzas', '2400000', 'Cra 15 #20-22', 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `opciones`
--

CREATE TABLE `opciones` (
  `ID_opciones` int(11) NOT NULL,
  `ID_pregunta` int(11) DEFAULT NULL,
  `texto_opcion` varchar(255) DEFAULT NULL,
  `cod_areafk` int(11) NOT NULL,
  `valor` int(12) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `opciones`
--

INSERT INTO `opciones` (`ID_opciones`, `ID_pregunta`, `texto_opcion`, `cod_areafk`, `valor`) VALUES
(1, 1, 'A. Sí, me encanta resolver problemas lógicos.', 1, 20),
(2, 1, 'B. No, me cuesta mucho.', 1, 0),
(3, 2, 'A. Sí, siempre quiero saber cómo funcionan las cosas.', 1, 20),
(4, 2, 'B. No, no me interesa mucho.', 1, 0),
(5, 3, 'A. Sí, disfruto los experimentos.', 1, 20),
(6, 3, 'B. No, me aburren.', 1, 0),
(7, 4, 'A. Sí, me gusta programar o diseñar apps.', 1, 20),
(8, 4, 'B. No, prefiero otras actividades.', 1, 0),
(9, 5, 'A. Sí, me parece fascinante.', 1, 20),
(10, 5, 'B. No, no es lo mío.', 1, 0),
(11, 6, 'A. Sí, me encanta expresarme de forma creativa.', 2, 20),
(12, 6, 'B. No, no suelo hacerlo.', 2, 0),
(13, 7, 'A. Sí, disfruto comunicar ideas creativamente.', 2, 20),
(14, 7, 'B. No, me cuesta.', 2, 0),
(15, 8, 'A. Sí, me siento cómodo hablando en público.', 2, 20),
(16, 8, 'B. No, me da mucha pena.', 2, 0),
(17, 9, 'A. Sí, me gusta mucho ese mundo visual.', 2, 20),
(18, 9, 'B. No, no me atrae.', 2, 0),
(19, 10, 'A. Sí, escribir es fácil para mí.', 2, 20),
(20, 10, 'B. No, se me dificulta.', 2, 0),
(21, 11, 'A. Sí, disfruto organizar actividades.', 3, 20),
(22, 11, 'B. No, me estresa.', 3, 0),
(23, 12, 'A. Sí, me gustan los números.', 3, 20),
(24, 12, 'B. No, los evito.', 3, 0),
(25, 13, 'A. Sí, me interesa el mundo empresarial.', 3, 20),
(26, 13, 'B. No, no me llama la atención.', 3, 0),
(27, 14, 'A. Sí, me gusta liderar y decidir.', 3, 0),
(28, 14, 'B. No, prefiero seguir instrucciones.', 3, 0),
(29, 15, 'A. Sí, me atrae la contabilidad.', 3, 0),
(30, 15, 'B. No, me parece complicada.', 3, 0),
(31, 16, 'A. Sí, me encanta resolver problemas lógicos.', 1, 20),
(32, 16, 'B. No, me cuesta mucho.', 1, 0),
(33, 17, 'A. Sí, siempre quiero saber cómo funcionan las cosas.', 1, 20),
(34, 17, 'B. No, no me interesa mucho.', 1, 0),
(35, 18, 'A. Sí, disfruto los experimentos.', 1, 20),
(36, 18, 'B. No, me aburren.', 1, 0),
(37, 19, 'A. Sí, me gusta programar o diseñar apps.', 1, 20),
(38, 19, 'B. No, prefiero otras actividades.', 1, 0),
(39, 20, 'A. Sí, me parece fascinante.', 1, 20),
(40, 20, 'B. No, no es lo mío.', 1, 0),
(41, 21, 'A. Sí, me encanta expresarme de forma creativa.', 2, 20),
(42, 21, 'B. No, no suelo hacerlo.', 2, 0),
(43, 22, 'A. Sí, disfruto comunicar ideas creativamente.', 2, 20),
(44, 22, 'B. No, me cuesta.', 2, 0),
(45, 23, 'A. Sí, me siento cómodo hablando en público.', 2, 20),
(46, 23, 'B. No, me da mucha pena.', 2, 0),
(47, 24, 'A. Sí, me gusta mucho ese mundo visual.', 2, 20),
(48, 24, 'B. No, no me atrae.', 2, 0),
(49, 25, 'A. Sí, escribir es fácil para mí.', 2, 20),
(50, 25, 'B. No, se me dificulta.', 2, 0),
(51, 26, 'A. Sí, disfruto organizar actividades.', 3, 20),
(52, 26, 'B. No, me estresa.', 3, 0),
(53, 27, 'A. Sí, me gustan los números.', 3, 20),
(54, 27, 'B. No, los evito.', 3, 0),
(55, 28, 'A. Sí, me interesa el mundo empresarial.', 3, 20),
(56, 28, 'B. No, no me llama la atención.', 3, 0),
(57, 29, 'A. Sí, me gusta liderar y decidir.', 3, 0),
(58, 29, 'B. No, prefiero seguir instrucciones.', 3, 0),
(59, 30, 'A. Sí, me atrae la contabilidad.', 3, 0),
(60, 30, 'B. No, me parece complicada.', 3, 0),
(61, 31, 'A. Sí, me encanta resolver problemas lógicos.', 1, 20),
(62, 31, 'B. No, me cuesta mucho.', 1, 0),
(63, 32, 'A. Sí, siempre quiero saber cómo funcionan las cosas.', 1, 20),
(64, 32, 'B. No, no me interesa mucho.', 1, 0),
(65, 33, 'A. Sí, disfruto los experimentos.', 1, 20),
(66, 33, 'B. No, me aburren.', 1, 0),
(67, 34, 'A. Sí, me gusta programar o diseñar apps.', 1, 20),
(68, 34, 'B. No, prefiero otras actividades.', 1, 0),
(69, 35, 'A. Sí, me parece fascinante.', 1, 20),
(70, 35, 'B. No, no es lo mío.', 1, 0),
(71, 36, 'A. Sí, me encanta expresarme de forma creativa.', 2, 20),
(72, 36, 'B. No, no suelo hacerlo.', 2, 0),
(73, 37, 'A. Sí, disfruto comunicar ideas creativamente.', 2, 20),
(74, 37, 'B. No, me cuesta.', 2, 0),
(75, 38, 'A. Sí, me siento cómodo hablando en público.', 2, 20),
(76, 38, 'B. No, me da mucha pena.', 2, 0),
(77, 39, 'A. Sí, me gusta mucho ese mundo visual.', 2, 20),
(78, 39, 'B. No, no me atrae.', 2, 0),
(79, 40, 'A. Sí, escribir es fácil para mí.', 2, 20),
(80, 40, 'B. No, se me dificulta.', 2, 0),
(81, 41, 'A. Sí, disfruto organizar actividades.', 3, 20),
(82, 41, 'B. No, me estresa.', 3, 0),
(83, 42, 'A. Sí, me gustan los números.', 3, 20),
(84, 42, 'B. No, los evito.', 3, 0),
(85, 43, 'A. Sí, me interesa el mundo empresarial.', 3, 20),
(86, 43, 'B. No, no me llama la atención.', 3, 0),
(87, 44, 'A. Sí, me gusta liderar y decidir.', 3, 0),
(88, 44, 'B. No, prefiero seguir instrucciones.', 3, 0),
(89, 45, 'A. Sí, me atrae la contabilidad.', 3, 0),
(90, 45, 'B. No, me parece complicada.', 3, 0),
(91, 46, 'A. Sí, me encanta resolver problemas lógicos.', 1, 20),
(92, 46, 'B. No, me cuesta mucho.', 1, 0),
(93, 47, 'A. Sí, siempre quiero saber cómo funcionan las cosas.', 1, 20),
(94, 47, 'B. No, no me interesa mucho.', 1, 0),
(95, 48, 'A. Sí, disfruto los experimentos.', 1, 20),
(96, 48, 'B. No, me aburren.', 1, 0),
(97, 49, 'A. Sí, me gusta programar o diseñar apps.', 1, 20),
(98, 49, 'B. No, prefiero otras actividades.', 1, 0),
(99, 50, 'A. Sí, me parece fascinante.', 1, 20),
(100, 50, 'B. No, no es lo mío.', 1, 0),
(101, 51, 'A. Sí, me encanta expresarme de forma creativa.', 2, 20),
(102, 51, 'B. No, no suelo hacerlo.', 2, 0),
(103, 52, 'A. Sí, disfruto comunicar ideas creativamente.', 2, 20),
(104, 52, 'B. No, me cuesta.', 2, 0),
(105, 53, 'A. Sí, me siento cómodo hablando en público.', 2, 20),
(106, 53, 'B. No, me da mucha pena.', 2, 0),
(107, 54, 'A. Sí, me gusta mucho ese mundo visual.', 2, 20),
(108, 54, 'B. No, no me atrae.', 2, 0),
(109, 55, 'A. Sí, escribir es fácil para mí.', 2, 20),
(110, 55, 'B. No, se me dificulta.', 2, 0),
(111, 56, 'A. Sí, disfruto organizar actividades.', 3, 20),
(112, 56, 'B. No, me estresa.', 3, 0),
(113, 57, 'A. Sí, me gustan los números.', 3, 20),
(114, 57, 'B. No, los evito.', 3, 0),
(115, 58, 'A. Sí, me interesa el mundo empresarial.', 3, 20),
(116, 58, 'B. No, no me llama la atención.', 3, 0),
(117, 59, 'A. Sí, me gusta liderar y decidir.', 3, 0),
(118, 59, 'B. No, prefiero seguir instrucciones.', 3, 0),
(119, 60, 'A. Sí, me atrae la contabilidad.', 3, 0),
(120, 60, 'B. No, me parece complicada.', 3, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preguntas`
--

CREATE TABLE `preguntas` (
  `ID_usuario` int(11) DEFAULT NULL,
  `ID_pregunta` int(11) NOT NULL,
  `texto_pregunta` text DEFAULT NULL,
  `ID_area` int(11) DEFAULT NULL,
  `Cod_encuesta` int(12) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `preguntas`
--

INSERT INTO `preguntas` (`ID_usuario`, `ID_pregunta`, `texto_pregunta`, `ID_area`, `Cod_encuesta`) VALUES
(1001, 1, '¿Disfrutas resolviendo problemas matemáticos o de lógica?', 1, 1),
(1001, 2, '¿Te interesa entender cómo funcionan las cosas, como máquinas, sistemas o procesos?', 1, 1),
(1001, 3, '¿Sueles disfrutar experimentos o actividades científicas?', 1, 1),
(1001, 4, '¿Te llama la atención el desarrollo de software, aplicaciones o páginas web?', 1, 1),
(1001, 5, '¿Te resulta atractivo el trabajo en laboratorios o entornos científicos?', 1, 1),
(1001, 6, '¿Disfrutas expresarte a través del dibujo, la música, la escritura o el teatro?', 2, 1),
(1001, 7, '¿Te interesa comunicar ideas de forma creativa?', 2, 1),
(1001, 8, '¿Te sientes cómodo hablando en público o presentando tus ideas?', 2, 1),
(1001, 9, '¿Te atrae el mundo de la fotografía, el cine o la edición de video?', 2, 1),
(1001, 10, '¿Tienes facilidad para redactar textos o contar historias?', 2, 1),
(1001, 11, '¿Disfrutas planear actividades, organizar tareas o eventos?', 3, 1),
(1001, 12, '¿Te gusta trabajar con números, estadísticas o finanzas?', 3, 1),
(1001, 13, '¿Te interesa cómo funcionan las empresas y los negocios?', 3, 1),
(1001, 14, '¿Te sientes cómodo tomando decisiones o liderando equipos?', 3, 1),
(1001, 15, '¿Te atraen las actividades relacionadas con la contabilidad o gestión?', 3, 1),
(1002, 16, '¿Disfrutas resolviendo problemas matemáticos o de lógica?', 1, 2),
(1002, 17, '¿Te interesa entender cómo funcionan las cosas, como máquinas, sistemas o procesos?', 1, 2),
(1002, 18, '¿Sueles disfrutar experimentos o actividades científicas?', 1, 2),
(1002, 19, '¿Te llama la atención el desarrollo de software, aplicaciones o páginas web?', 1, 2),
(1002, 20, '¿Te resulta atractivo el trabajo en laboratorios o entornos científicos?', 1, 2),
(1002, 21, '¿Disfrutas expresarte a través del dibujo, la música, la escritura o el teatro?', 2, 2),
(1002, 22, '¿Te interesa comunicar ideas de forma creativa?', 2, 2),
(1002, 23, '¿Te sientes cómodo hablando en público o presentando tus ideas?', 2, 2),
(1002, 24, '¿Te atrae el mundo de la fotografía, el cine o la edición de video?', 2, 2),
(1002, 25, '¿Tienes facilidad para redactar textos o contar historias?', 2, 2),
(1002, 26, '¿Disfrutas planear actividades, organizar tareas o eventos?', 3, 2),
(1002, 27, '¿Te gusta trabajar con números, estadísticas o finanzas?', 3, 2),
(1002, 28, '¿Te interesa cómo funcionan las empresas y los negocios?', 3, 2),
(1002, 29, '¿Te sientes cómodo tomando decisiones o liderando equipos?', 3, 2),
(1002, 30, '¿Te atraen las actividades relacionadas con la contabilidad o gestión?', 3, 2),
(1003, 31, '¿Disfrutas resolviendo problemas matemáticos o de lógica?', 1, 3),
(1003, 32, '¿Te interesa entender cómo funcionan las cosas, como máquinas, sistemas o procesos?', 1, 3),
(1003, 33, '¿Sueles disfrutar experimentos o actividades científicas?', 1, 3),
(1003, 34, '¿Te llama la atención el desarrollo de software, aplicaciones o páginas web?', 1, 3),
(1003, 35, '¿Te resulta atractivo el trabajo en laboratorios o entornos científicos?', 1, 3),
(1003, 36, '¿Disfrutas expresarte a través del dibujo, la música, la escritura o el teatro?', 2, 3),
(1003, 37, '¿Te interesa comunicar ideas de forma creativa?', 2, 3),
(1003, 38, '¿Te sientes cómodo hablando en público o presentando tus ideas?', 2, 3),
(1003, 39, '¿Te atrae el mundo de la fotografía, el cine o la edición de video?', 2, 3),
(1003, 40, '¿Tienes facilidad para redactar textos o contar historias?', 2, 3),
(1003, 41, '¿Disfrutas planear actividades, organizar tareas o eventos?', 3, 3),
(1003, 42, '¿Te gusta trabajar con números, estadísticas o finanzas?', 3, 3),
(1003, 43, '¿Te interesa cómo funcionan las empresas y los negocios?', 3, 3),
(1003, 44, '¿Te sientes cómodo tomando decisiones o liderando equipos?', 3, 3),
(1003, 45, '¿Te atraen las actividades relacionadas con la contabilidad o gestión?', 3, 3),
(1004, 46, '¿Disfrutas resolviendo problemas matemáticos o de lógica?', 1, 4),
(1004, 47, '¿Te interesa entender cómo funcionan las cosas, como máquinas, sistemas o procesos?', 1, 4),
(1004, 48, '¿Sueles disfrutar experimentos o actividades científicas?', 1, 4),
(1004, 49, '¿Te llama la atención el desarrollo de software, aplicaciones o páginas web?', 1, 4),
(1004, 50, '¿Te resulta atractivo el trabajo en laboratorios o entornos científicos?', 1, 4),
(1004, 51, '¿Disfrutas expresarte a través del dibujo, la música, la escritura o el teatro?', 2, 4),
(1004, 52, '¿Te interesa comunicar ideas de forma creativa?', 2, 4),
(1004, 53, '¿Te sientes cómodo hablando en público o presentando tus ideas?', 2, 4),
(1004, 54, '¿Te atrae el mundo de la fotografía, el cine o la edición de video?', 2, 4),
(1004, 55, '¿Tienes facilidad para redactar textos o contar historias?', 2, 4),
(1004, 56, '¿Disfrutas planear actividades, organizar tareas o eventos?', 3, 4),
(1004, 57, '¿Te gusta trabajar con números, estadísticas o finanzas?', 3, 4),
(1004, 58, '¿Te interesa cómo funcionan las empresas y los negocios?', 3, 4),
(1004, 59, '¿Te sientes cómodo tomando decisiones o liderando equipos?', 3, 4),
(1004, 60, '¿Te atraen las actividades relacionadas con la contabilidad o gestión?', 3, 4),
(1005, 61, '¿Disfrutas resolviendo problemas matemáticos o de lógica?', 1, 5),
(1005, 62, '¿Te interesa entender cómo funcionan las cosas, como máquinas, sistemas o procesos?', 1, 5),
(1005, 63, '¿Sueles disfrutar experimentos o actividades científicas?', 1, 5),
(1005, 64, '¿Te llama la atención el desarrollo de software, aplicaciones o páginas web?', 1, 5),
(1005, 65, '¿Te resulta atractivo el trabajo en laboratorios o entornos científicos?', 1, 5),
(1005, 66, '¿Disfrutas expresarte a través del dibujo, la música, la escritura o el teatro?', 2, 5),
(1005, 67, '¿Te interesa comunicar ideas de forma creativa?', 2, 5),
(1005, 68, '¿Te sientes cómodo hablando en público o presentando tus ideas?', 2, 5),
(1005, 69, '¿Te atrae el mundo de la fotografía, el cine o la edición de video?', 2, 5),
(1005, 70, '¿Tienes facilidad para redactar textos o contar historias?', 2, 5),
(1005, 71, '¿Disfrutas planear actividades, organizar tareas o eventos?', 3, 5),
(1005, 72, '¿Te gusta trabajar con números, estadísticas o finanzas?', 3, 5),
(1005, 73, '¿Te interesa cómo funcionan las empresas y los negocios?', 3, 5),
(1005, 74, '¿Te sientes cómodo tomando decisiones o liderando equipos?', 3, 5),
(1005, 75, '¿Te atraen las actividades relacionadas con la contabilidad o gestión?', 3, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `DNI` int(11) NOT NULL,
  `Nombre_Usuario` varchar(255) DEFAULT NULL,
  `Correo` varchar(255) DEFAULT NULL,
  `Direccion_usuario` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`DNI`, `Nombre_Usuario`, `Correo`, `Direccion_usuario`) VALUES
(1001, 'Camila Torres', 'camila.torres@mail.com', 'Calle 10 #12-34, Bogotá'),
(1002, 'Juan Pérez', 'juan.perez@mail.com', 'Carrera 7 #45-67, Medellín'),
(1003, 'Laura Gómez', 'laura.gomez@mail.com', 'Av. 68 #30-15, Cali'),
(1004, 'Andrés Ruiz', 'andres.ruiz@mail.com', 'Cra. 9 #98-21, Barranquilla'),
(1005, 'Sofía Mendoza', 'sofia.mendoza@mail.com', 'Cll. 23 #14-60, Bucaramanga');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vistaencuestarecomendacion`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vistaencuestarecomendacion` (
`NombreEncuestado` varchar(255)
,`Dia_Encuesta` date
,`Nombre_area` varchar(255)
,`PuntajeArea` decimal(33,0)
,`RecomendacionCarrera` varchar(74)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vistausuariosconencuestas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vistausuariosconencuestas` (
`DNI` int(11)
,`Nombre_Usuario` varchar(255)
,`Correo` varchar(255)
,`Direccion_usuario` varchar(255)
,`FechaEncuesta` date
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_puntajes_encuestas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_puntajes_encuestas` (
`Cod_encuestas` int(11)
,`Fecha_Encuesta` date
,`DNI` int(11)
,`Nombre_Usuario` varchar(255)
,`Area_Evaluada` varchar(255)
,`Carrera_Relacionada` varchar(100)
,`Puntaje_Total` decimal(33,0)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vistaencuestarecomendacion`
--
DROP TABLE IF EXISTS `vistaencuestarecomendacion`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vistaencuestarecomendacion`  AS WITH PuntajesPorEncuestadoArea AS (SELECT `u`.`Nombre_Usuario` AS `Nombre_Usuario`, `e`.`fecha` AS `Dia_Encuesta`, `a`.`Nombre_area` AS `Nombre_area`, sum(`o`.`valor`) AS `PuntajeTotalArea`, `e`.`dni` AS `dni` FROM ((((`usuario` `u` join `encuestas` `e` on(`u`.`DNI` = `e`.`dni`)) join `alm_puntaje` `ap` on(`e`.`dni` = `ap`.`DNI`)) join `areas` `a` on(`ap`.`cod_area` = `a`.`ID_area`)) join `opciones` `o` on(`ap`.`cod_opciones` = `o`.`ID_opciones`)) GROUP BY `u`.`Nombre_Usuario`, `e`.`fecha`, `a`.`Nombre_area`, `e`.`dni`), AreaMasAltaPuntuacion AS (SELECT `puntajesporencuestadoarea`.`dni` AS `dni`, `puntajesporencuestadoarea`.`Nombre_area` AS `Nombre_area`, `puntajesporencuestadoarea`.`PuntajeTotalArea` AS `PuntajeTotalArea`, row_number() over ( partition by `puntajesporencuestadoarea`.`dni` order by `puntajesporencuestadoarea`.`PuntajeTotalArea` desc) AS `rn` FROM `puntajesporencuestadoarea`) SELECT `ppa`.`Nombre_Usuario` AS `NombreEncuestado`, `ppa`.`Dia_Encuesta` AS `Dia_Encuesta`, `ppa`.`Nombre_area` AS `Nombre_area`, `ppa`.`PuntajeTotalArea` AS `PuntajeArea`, CASE WHEN `ppa`.`Nombre_area` = 'Ciencia y Tecnología' THEN 'Ingeniería de Sistemas, Física, Matemáticas, Bioquímica' WHEN `ppa`.`Nombre_area` = 'Comunicación y Artes' THEN 'Diseño Gráfico, Periodismo, Artes Audiovisuales, Literatura' WHEN `ppa`.`Nombre_area` = 'Administrativo' THEN 'Administración de Empresas, Contaduría Pública, Finanzas, Recursos Humanos' ELSE 'Consulta nuestra base de datos de carreras para más opciones.' END AS `RecomendacionCarrera` FROM (`puntajesporencuestadoarea` `ppa` join `areamasaltapuntuacion` `ampa` on(`ppa`.`dni` = `ampa`.`dni` and `ppa`.`Nombre_area` = `ampa`.`Nombre_area`)) WHERE `ampa`.`rn` = 11  ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vistausuariosconencuestas`
--
DROP TABLE IF EXISTS `vistausuariosconencuestas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vistausuariosconencuestas`  AS SELECT `u`.`DNI` AS `DNI`, `u`.`Nombre_Usuario` AS `Nombre_Usuario`, `u`.`Correo` AS `Correo`, `u`.`Direccion_usuario` AS `Direccion_usuario`, `e`.`fecha` AS `FechaEncuesta` FROM (`usuario` `u` left join `encuestas` `e` on(`u`.`DNI` = `e`.`dni`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_puntajes_encuestas`
--
DROP TABLE IF EXISTS `vista_puntajes_encuestas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_puntajes_encuestas`  AS SELECT `e`.`Cod_encuestas` AS `Cod_encuestas`, `e`.`fecha` AS `Fecha_Encuesta`, `u`.`DNI` AS `DNI`, `u`.`Nombre_Usuario` AS `Nombre_Usuario`, `a`.`Nombre_area` AS `Area_Evaluada`, `c`.`Nombre_carrera` AS `Carrera_Relacionada`, sum(`o`.`valor`) AS `Puntaje_Total` FROM (((((`encuestas` `e` join `usuario` `u` on(`e`.`dni` = `u`.`DNI`)) join `alm_puntaje` `ap` on(`u`.`DNI` = `ap`.`DNI`)) join `opciones` `o` on(`ap`.`cod_opciones` = `o`.`ID_opciones`)) join `areas` `a` on(`ap`.`cod_area` = `a`.`ID_area`)) join `carreras` `c` on(`a`.`ID_area` = `c`.`Cod_area`)) GROUP BY `e`.`Cod_encuestas`, `e`.`fecha`, `u`.`DNI`, `u`.`Nombre_Usuario`, `a`.`Nombre_area`, `c`.`Nombre_carrera` ORDER BY `e`.`Cod_encuestas` ASC, `u`.`DNI` ASC, `a`.`Nombre_area` ASC ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alm_puntaje`
--
ALTER TABLE `alm_puntaje`
  ADD PRIMARY KEY (`id_respuesta`),
  ADD KEY `cod_opciones` (`cod_opciones`),
  ADD KEY `cod_area` (`cod_area`),
  ADD KEY `cod_preguntas` (`cod_preguntas`),
  ADD KEY `fk_alm_puntaje_usuario` (`DNI`);

--
-- Indices de la tabla `areas`
--
ALTER TABLE `areas`
  ADD PRIMARY KEY (`ID_area`),
  ADD KEY `fk_area_opciones` (`id_opciones`);

--
-- Indices de la tabla `carreras`
--
ALTER TABLE `carreras`
  ADD PRIMARY KEY (`Cod_carrera`),
  ADD KEY `Cod_area` (`Cod_area`);

--
-- Indices de la tabla `encuestas`
--
ALTER TABLE `encuestas`
  ADD PRIMARY KEY (`Cod_encuestas`),
  ADD KEY `dni` (`dni`);

--
-- Indices de la tabla `instituto_educacion_superior`
--
ALTER TABLE `instituto_educacion_superior`
  ADD PRIMARY KEY (`Cod_instituto`),
  ADD KEY `Cod_carreras` (`Cod_carreras`);

--
-- Indices de la tabla `opciones`
--
ALTER TABLE `opciones`
  ADD PRIMARY KEY (`ID_opciones`),
  ADD KEY `ID_pregunta` (`ID_pregunta`),
  ADD KEY `cod_areafk` (`cod_areafk`);

--
-- Indices de la tabla `preguntas`
--
ALTER TABLE `preguntas`
  ADD PRIMARY KEY (`ID_pregunta`),
  ADD KEY `ID_area` (`ID_area`),
  ADD KEY `Cod_encuesta` (`Cod_encuesta`),
  ADD KEY `ID_usuario` (`ID_usuario`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`DNI`);

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alm_puntaje`
--
ALTER TABLE `alm_puntaje`
  ADD CONSTRAINT `alm_puntaje_ibfk_1` FOREIGN KEY (`cod_opciones`) REFERENCES `opciones` (`ID_opciones`),
  ADD CONSTRAINT `alm_puntaje_ibfk_2` FOREIGN KEY (`cod_area`) REFERENCES `areas` (`ID_area`),
  ADD CONSTRAINT `alm_puntaje_ibfk_3` FOREIGN KEY (`cod_preguntas`) REFERENCES `preguntas` (`ID_pregunta`),
  ADD CONSTRAINT `fk_alm_puntaje_usuario` FOREIGN KEY (`DNI`) REFERENCES `usuario` (`DNI`);

--
-- Filtros para la tabla `areas`
--
ALTER TABLE `areas`
  ADD CONSTRAINT `fk_area_opciones` FOREIGN KEY (`id_opciones`) REFERENCES `opciones` (`ID_opciones`);

--
-- Filtros para la tabla `carreras`
--
ALTER TABLE `carreras`
  ADD CONSTRAINT `carreras_ibfk_1` FOREIGN KEY (`Cod_area`) REFERENCES `areas` (`ID_area`);

--
-- Filtros para la tabla `encuestas`
--
ALTER TABLE `encuestas`
  ADD CONSTRAINT `encuestas_ibfk_1` FOREIGN KEY (`dni`) REFERENCES `usuario` (`DNI`);

--
-- Filtros para la tabla `instituto_educacion_superior`
--
ALTER TABLE `instituto_educacion_superior`
  ADD CONSTRAINT `instituto_educacion_superior_ibfk_1` FOREIGN KEY (`Cod_carreras`) REFERENCES `carreras` (`Cod_carrera`);

--
-- Filtros para la tabla `opciones`
--
ALTER TABLE `opciones`
  ADD CONSTRAINT `cod_areafk` FOREIGN KEY (`cod_areafk`) REFERENCES `areas` (`ID_area`),
  ADD CONSTRAINT `opciones_ibfk_1` FOREIGN KEY (`ID_pregunta`) REFERENCES `preguntas` (`ID_pregunta`);

--
-- Filtros para la tabla `preguntas`
--
ALTER TABLE `preguntas`
  ADD CONSTRAINT `preguntas_ibfk_1` FOREIGN KEY (`ID_area`) REFERENCES `areas` (`ID_area`),
  ADD CONSTRAINT `preguntas_ibfk_2` FOREIGN KEY (`Cod_encuesta`) REFERENCES `encuestas` (`Cod_encuestas`),
  ADD CONSTRAINT `preguntas_ibfk_3` FOREIGN KEY (`ID_usuario`) REFERENCES `usuario` (`DNI`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
