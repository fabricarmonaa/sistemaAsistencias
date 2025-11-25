-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-10-2025 a las 03:05:06
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
-- Base de datos: `sistema_asistencias`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alumno`
--

CREATE TABLE `alumno` (
  `dni` int(11) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `cursoID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alumno`
--

INSERT INTO `alumno` (`dni`, `nombres`, `apellidos`, `cursoID`) VALUES
(20000000, 'Juan', 'Pérez', 11),
(20000001, 'Ana', 'Gómez', 11),
(20000002, 'Carlos', 'Ruiz', 11),
(20000003, 'María', 'López', 11),
(20000004, 'Luis', 'Fernández', 11),
(20000005, 'Elena', 'Sánchez', 11),
(20000006, 'Diego', 'Martínez', 11),
(20000007, 'Sofía', 'García', 11),
(20000008, 'Oliver', 'Smith', 12),
(20000009, 'Emma', 'Johnson', 12),
(20000010, 'Liam', 'Williams', 12),
(20000011, 'Ava', 'Jones', 12),
(20000012, 'Noah', 'Brown', 12),
(20000013, 'Isabella', 'Davis', 12),
(20000014, 'Ethan', 'Miller', 12),
(20000015, 'Mia', 'Wilson', 12),
(20000016, 'Lucas', 'Moore', 13),
(20000017, 'Amelia', 'Taylor', 13),
(20000018, 'Benjamin', 'Anderson', 13),
(20000019, 'Harper', 'Thomas', 13),
(20000020, 'Henry', 'Jackson', 13),
(20000021, 'Charlotte', 'White', 13),
(20000022, 'Alexander', 'Harris', 13),
(20000023, 'Evelyn', 'Martin', 13),
(20000024, 'Daniel', 'Thompson', 14),
(20000025, 'Abigail', 'Garcia', 14),
(20000026, 'Samuel', 'Martins', 14),
(20000027, 'Ella', 'Clark', 14),
(20000028, 'David', 'Lee', 14),
(20000029, 'Grace', 'Walker', 14),
(20000030, 'Matthew', 'Hall', 14),
(20000031, 'Chloe', 'Allen', 14),
(20000032, 'Sebastian', 'Young', 15),
(20000033, 'Lily', 'Hernandez', 15),
(20000034, 'Gabriel', 'King', 15),
(20000035, 'Zoe', 'Wright', 15),
(20000036, 'Nathan', 'Lopez', 15),
(20000037, 'Hannah', 'Hill', 15),
(20000038, 'Joseph', 'Scott', 15),
(20000039, 'Victoria', 'Green', 15),
(20000040, 'Anthony', 'Adams', 16),
(20000041, 'Samantha', 'Baker', 16),
(20000042, 'Ryan', 'Gonzalez', 16),
(20000043, 'Aria', 'Nelson', 16),
(20000044, 'Caleb', 'Carter', 16),
(20000045, 'Madison', 'Mitchell', 16),
(20000046, 'Isaac', 'Perez', 16),
(20000047, 'Avery', 'Roberts', 16),
(20000048, 'Owen', 'Turner', 17),
(20000049, 'Scarlett', 'Phillips', 17),
(20000050, 'Wyatt', 'Campbell', 17),
(20000051, 'Addison', 'Parker', 17),
(20000052, 'Jack', 'Evans', 17),
(20000053, 'Luna', 'Edwards', 17),
(20000054, 'Luke', 'Collins', 17),
(20000055, 'Stella', 'Stewart', 17),
(20000056, 'Julian', 'Sanchez', 21),
(20000057, 'Nora', 'Morris', 21),
(20000058, 'Christian', 'Rogers', 21),
(20000059, 'Hazel', 'Reyes', 21),
(20000060, 'Jonathan', 'Morgan', 21),
(20000061, 'Violet', 'Bell', 21),
(20000062, 'Dylan', 'Murphy', 21),
(20000063, 'Aurora', 'Bailey', 21),
(20000064, 'Cameron', 'Rivera', 22),
(20000065, 'Penelope', 'Cooper', 22),
(20000066, 'Eli', 'Richardson', 22),
(20000067, 'Eliana', 'Cox', 22),
(20000068, 'Aaron', 'Howard', 22),
(20000069, 'Clara', 'Ward', 22),
(20000070, 'Thomas', 'Torres', 22),
(20000071, 'Emilia', 'Peterson', 22),
(20000072, 'Charles', 'Gray', 23),
(20000073, 'Laila', 'Ramirez', 23),
(20000074, 'Josiah', 'James', 23),
(20000075, 'Camila', 'Watson', 23),
(20000076, 'Evan', 'Brooks', 23),
(20000077, 'Alice', 'Kelly', 23),
(20000078, 'Adam', 'Sanders', 23),
(20000079, 'Isla', 'Price', 23),
(20000080, 'Jason', 'Bennett', 24),
(20000081, 'Leah', 'Wood', 24),
(20000082, 'Connor', 'Barnes', 24),
(20000083, 'Alyssa', 'Ross', 24),
(20000084, 'Nicholas', 'Henderson', 24),
(20000085, 'Bella', 'Coleman', 24),
(20000086, 'Brandon', 'Jenkins', 24),
(20000087, 'Naomi', 'Pérez', 24),
(20000088, 'Hunter', 'Gómez', 25),
(20000089, 'Ruby', 'Ruiz', 25),
(20000090, 'Max', 'López', 25),
(20000091, 'Layla', 'Fernández', 25),
(20000092, 'Dominic', 'Sánchez', 25),
(20000093, 'Ariana', 'Martínez', 25),
(20000094, 'Jasper', 'García', 25),
(20000095, 'Avery', 'Smith', 25),
(20000096, 'Adrian', 'Johnson', 31),
(20000097, 'Maya', 'Williams', 31),
(20000098, 'Leo', 'Jones', 31),
(20000099, 'Amara', 'Brown', 31),
(20000100, 'Kai', 'Davis', 31),
(20000101, 'Elise', 'Miller', 31),
(20000102, 'Rafael', 'Wilson', 31),
(20000103, 'Sienna', 'Moore', 31),
(20000104, 'Victor', 'Taylor', 32),
(20000105, 'Freya', 'Anderson', 32),
(20000106, 'Diego', 'Thomas', 32),
(20000107, 'Lucia', 'Jackson', 32),
(20000108, 'Marco', 'White', 32),
(20000109, 'Sofia', 'Harris', 32),
(20000110, 'Hugo', 'Martin', 32),
(20000111, 'Valentina', 'Thompson', 32),
(20000112, 'Mateo', 'Garcia', 33),
(20000113, 'Camila', 'Martins', 33),
(20000114, 'Iker', 'Clark', 33),
(20000115, 'Isabella', 'Lee', 33),
(20000116, 'Sergio', 'Walker', 33),
(20000117, 'Julieta', 'Hall', 33),
(20000118, 'Bruno', 'Allen', 33),
(20000119, 'Catalina', 'Young', 33),
(20000120, 'Emilio', 'Hernandez', 34),
(20000121, 'Renata', 'King', 34),
(20000122, 'Andres', 'Wright', 34),
(20000123, 'Luciana', 'Lopez', 34),
(20000124, 'Ricardo', 'Hill', 34),
(20000125, 'Marina', 'Scott', 34),
(20000126, 'Pablo', 'Green', 34),
(20000127, 'Gabriela', 'Adams', 34),
(20000128, 'Alonso', 'Baker', 41),
(20000129, 'Florencia', 'Gonzalez', 41),
(20000130, 'Esteban', 'Nelson', 41),
(20000131, 'Paula', 'Carter', 41),
(20000132, 'Alfredo', 'Mitchell', 41),
(20000133, 'Carla', 'Perez', 41),
(20000134, 'Federico', 'Roberts', 41),
(20000135, 'Daniela', 'Turner', 41),
(20000136, 'Juan', 'Phillips', 42),
(20000137, 'Ana', 'Campbell', 42),
(20000138, 'Carlos', 'Parker', 42),
(20000139, 'María', 'Evans', 42),
(20000140, 'Luis', 'Edwards', 42),
(20000141, 'Elena', 'Collins', 42),
(20000142, 'Diego', 'Stewart', 42),
(20000143, 'Sofía', 'Sanchez', 42),
(20000144, 'Oliver', 'Morris', 43),
(20000145, 'Emma', 'Rogers', 43),
(20000146, 'Liam', 'Reyes', 43),
(20000147, 'Ava', 'Morgan', 43),
(20000148, 'Noah', 'Bell', 43),
(20000149, 'Isabella', 'Murphy', 43),
(20000150, 'Ethan', 'Bailey', 43),
(20000151, 'Mia', 'Rivera', 43),
(20000152, 'Lucas', 'Cooper', 44),
(20000153, 'Amelia', 'Richardson', 44),
(20000154, 'Benjamin', 'Cox', 44),
(20000155, 'Harper', 'Howard', 44),
(20000156, 'Henry', 'Ward', 44),
(20000157, 'Charlotte', 'Torres', 44),
(20000158, 'Alexander', 'Peterson', 44),
(20000159, 'Evelyn', 'Gray', 44),
(20000160, 'Daniel', 'Ramirez', 51),
(20000161, 'Abigail', 'James', 51),
(20000162, 'Samuel', 'Watson', 51),
(20000163, 'Ella', 'Brooks', 51),
(20000164, 'David', 'Kelly', 51),
(20000165, 'Grace', 'Sanders', 51),
(20000166, 'Matthew', 'Price', 51),
(20000167, 'Chloe', 'Bennett', 51),
(20000168, 'Sebastian', 'Wood', 52),
(20000169, 'Lily', 'Barnes', 52),
(20000170, 'Gabriel', 'Ross', 52),
(20000171, 'Zoe', 'Henderson', 52),
(20000172, 'Nathan', 'Coleman', 52),
(20000173, 'Hannah', 'Jenkins', 52),
(20000174, 'Joseph', 'Pérez', 52),
(20000175, 'Victoria', 'Gómez', 52),
(20000176, 'Anthony', 'Ruiz', 54),
(20000177, 'Samantha', 'López', 54),
(20000178, 'Ryan', 'Fernández', 54),
(20000179, 'Aria', 'Sánchez', 54),
(20000180, 'Caleb', 'Martínez', 54),
(20000181, 'Madison', 'García', 54),
(20000182, 'Isaac', 'Smith', 54),
(20000183, 'Avery', 'Johnson', 54),
(20000184, 'Owen', 'Williams', 61),
(20000185, 'Scarlett', 'Jones', 61),
(20000186, 'Wyatt', 'Brown', 61),
(20000187, 'Addison', 'Davis', 61),
(20000188, 'Jack', 'Miller', 61),
(20000189, 'Luna', 'Wilson', 61),
(20000190, 'Luke', 'Moore', 61),
(20000191, 'Stella', 'Taylor', 61),
(20000192, 'Julian', 'Anderson', 62),
(20000193, 'Nora', 'Thomas', 62),
(20000194, 'Christian', 'Jackson', 62),
(20000195, 'Hazel', 'White', 62),
(20000196, 'Jonathan', 'Harris', 62),
(20000197, 'Violet', 'Martin', 62),
(20000198, 'Dylan', 'Thompson', 62),
(20000199, 'Aurora', 'Garcia', 62),
(20000200, 'Cameron', 'Martins', 64),
(20000201, 'Penelope', 'Clark', 64),
(20000202, 'Eli', 'Lee', 64),
(20000203, 'Eliana', 'Walker', 64),
(20000204, 'Aaron', 'Hall', 64),
(20000205, 'Clara', 'Allen', 64),
(20000206, 'Thomas', 'Young', 64),
(20000207, 'Emilia', 'Hernandez', 64),
(20000208, 'Charles', 'King', 71),
(20000209, 'Laila', 'Wright', 71),
(20000210, 'Josiah', 'Lopez', 71),
(20000211, 'Camila', 'Hill', 71),
(20000212, 'Evan', 'Scott', 71),
(20000213, 'Alice', 'Green', 71),
(20000214, 'Adam', 'Adams', 71),
(20000215, 'Isla', 'Baker', 71),
(20000216, 'Jason', 'Gonzalez', 72),
(20000217, 'Leah', 'Nelson', 72),
(20000218, 'Connor', 'Carter', 72),
(20000219, 'Alyssa', 'Mitchell', 72),
(20000220, 'Nicholas', 'Perez', 72),
(20000221, 'Bella', 'Roberts', 72),
(20000222, 'Brandon', 'Turner', 72),
(20000223, 'Naomi', 'Phillips', 72),
(20000224, 'Hunter', 'Campbell', 74),
(20000225, 'Ruby', 'Parker', 74),
(20000226, 'Max', 'Evans', 74),
(20000227, 'Layla', 'Edwards', 74),
(20000228, 'Dominic', 'Collins', 74),
(20000229, 'Ariana', 'Stewart', 74),
(20000230, 'Jasper', 'Sanchez', 74),
(20000231, 'Avery', 'Morris', 74);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia`
--

CREATE TABLE `asistencia` (
  `alumnoDNI` int(11) NOT NULL,
  `tipoAsistencia` enum('presente','ausente','llega tarde','retirado') NOT NULL,
  `curso` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `asistencias` int(11) DEFAULT 0,
  `faltas` int(11) DEFAULT 0,
  `faltas_justificadas` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asistencia`
--

INSERT INTO `asistencia` (`alumnoDNI`, `tipoAsistencia`, `curso`, `anio`, `asistencias`, `faltas`, `faltas_justificadas`) VALUES
(20000000, 'presente', 11, 0, 50, 41, 0),
(20000001, 'presente', 11, 0, 50, 41, 0),
(20000002, 'presente', 11, 0, 50, 41, 0),
(20000003, 'presente', 11, 0, 50, 41, 0),
(20000004, 'presente', 11, 0, 50, 41, 1),
(20000005, 'presente', 11, 0, 50, 41, 0),
(20000006, 'presente', 11, 0, 50, 41, 0),
(20000007, 'presente', 11, 0, 50, 41, 0),
(20000008, 'presente', 12, 0, 2, 1, 0),
(20000009, 'presente', 12, 0, 2, 1, 0),
(20000010, 'presente', 12, 0, 2, 1, 0),
(20000011, 'presente', 12, 0, 2, 1, 0),
(20000012, 'presente', 12, 0, 2, 2, 0),
(20000013, 'presente', 12, 0, 2, 1, 0),
(20000014, 'presente', 12, 0, 2, 1, 0),
(20000015, 'presente', 12, 0, 2, 1, 0),
(20000040, 'presente', 16, 0, 81, 1, 0),
(20000041, 'presente', 16, 0, 81, 1, 0),
(20000042, 'presente', 16, 0, 81, 1, 0),
(20000043, 'presente', 16, 0, 81, 1, 0),
(20000044, 'presente', 16, 0, 81, 1, 0),
(20000045, 'presente', 16, 0, 81, 1, 0),
(20000046, 'presente', 16, 0, 81, 1, 0),
(20000047, 'presente', 16, 0, 81, 1, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clase`
--

CREATE TABLE `clase` (
  `claseID` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `cursoID` int(11) NOT NULL,
  `claseInfo` enum('clase normal','ausencia profesor','paro docente','paro de auxiliares') DEFAULT 'clase normal'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clase`
--

INSERT INTO `clase` (`claseID`, `fecha`, `cursoID`, `claseInfo`) VALUES
(9, '2025-10-12', 11, ''),
(10, '2025-10-12', 11, ''),
(11, '2025-10-12', 11, ''),
(12, '2025-10-12', 11, ''),
(13, '2025-10-12', 11, ''),
(14, '2025-10-12', 32, ''),
(15, '2025-10-13', 32, ''),
(16, '2025-10-12', 32, ''),
(17, '2025-10-12', 32, ''),
(18, '2025-10-12', 32, ''),
(19, '2025-10-12', 32, ''),
(20, '2025-10-12', 32, ''),
(21, '2025-10-12', 32, ''),
(22, '2025-10-12', 32, ''),
(23, '2025-10-12', 11, ''),
(24, '2025-10-12', 12, ''),
(25, '2025-10-12', 12, ''),
(26, '2025-10-12', 12, ''),
(27, '2025-10-13', 13, ''),
(28, '2025-10-13', 13, ''),
(29, '2025-10-13', 13, ''),
(30, '2025-10-13', 13, ''),
(31, '2025-10-13', 11, ''),
(32, '2025-10-14', 12, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `curso`
--

CREATE TABLE `curso` (
  `cursoID` int(11) NOT NULL,
  `curso` int(11) NOT NULL,
  `division` int(11) NOT NULL,
  `turno` enum('manana',' tarde',' vespertino') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `curso`
--

INSERT INTO `curso` (`cursoID`, `curso`, `division`, `turno`) VALUES
(11, 1, 1, ' tarde'),
(12, 1, 2, 'manana'),
(13, 1, 3, 'manana'),
(14, 1, 4, 'manana'),
(15, 1, 5, ' tarde'),
(16, 1, 6, 'manana'),
(17, 1, 7, 'manana'),
(21, 2, 1, ' tarde'),
(22, 2, 2, 'manana'),
(23, 2, 3, ' tarde'),
(24, 2, 4, 'manana'),
(25, 2, 5, ' tarde'),
(31, 3, 1, 'manana'),
(32, 3, 2, ' tarde'),
(33, 3, 3, 'manana'),
(34, 3, 4, 'manana'),
(41, 4, 1, ' tarde'),
(42, 4, 2, 'manana'),
(43, 4, 3, 'manana'),
(44, 4, 4, 'manana'),
(51, 5, 1, ' tarde'),
(52, 5, 2, 'manana'),
(54, 5, 4, ' tarde'),
(61, 6, 1, 'manana'),
(62, 6, 2, 'manana'),
(64, 6, 4, 'manana'),
(71, 7, 1, ' vespertino'),
(72, 7, 2, ' vespertino'),
(74, 7, 4, ' vespertino');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `excepcion`
--

CREATE TABLE `excepcion` (
  `alumnoDNI` int(11) NOT NULL,
  `tipoExcepcion` enum('inasistencia','llega tarde','retirado') NOT NULL,
  `fecha` date NOT NULL,
  `hora` time DEFAULT NULL,
  `cantFalta` decimal(3,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `excepcion`
--

INSERT INTO `excepcion` (`alumnoDNI`, `tipoExcepcion`, `fecha`, `hora`, `cantFalta`) VALUES
(20000001, 'inasistencia', '2025-10-12', NULL, 0.25);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preceptores`
--

CREATE TABLE `preceptores` (
  `id` int(11) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `preceptores`
--

INSERT INTO `preceptores` (`id`, `usuario`, `contrasena`, `email`, `telefono`) VALUES
(47055885, 'Leandro', '$2b$10$6RwefEzYvqThwmv7FLF31u9dWQ0hAzr3Kxb9w1Do5k/eegFj1p2vK', 'Leandrofm49@gmail.com', '2233125895\n'),
(47963568, 'Fabricio', '47963568', 'fabri@gmail.com', ''),
(72493588, 'Pablo', '72493588', 'pabli@gmail.com', ''),
(75394682, 'Leonel', '75394682', 'leo@gmail.com', '');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alumno`
--
ALTER TABLE `alumno`
  ADD PRIMARY KEY (`dni`),
  ADD KEY `cursoID` (`cursoID`);

--
-- Indices de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD PRIMARY KEY (`alumnoDNI`,`curso`,`anio`);

--
-- Indices de la tabla `clase`
--
ALTER TABLE `clase`
  ADD PRIMARY KEY (`claseID`),
  ADD KEY `cursoID` (`cursoID`);

--
-- Indices de la tabla `curso`
--
ALTER TABLE `curso`
  ADD PRIMARY KEY (`cursoID`);

--
-- Indices de la tabla `excepcion`
--
ALTER TABLE `excepcion`
  ADD PRIMARY KEY (`alumnoDNI`,`fecha`,`tipoExcepcion`);

--
-- Indices de la tabla `preceptores`
--
ALTER TABLE `preceptores`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clase`
--
ALTER TABLE `clase`
  MODIFY `claseID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT de la tabla `curso`
--
ALTER TABLE `curso`
  MODIFY `cursoID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alumno`
--
ALTER TABLE `alumno`
  ADD CONSTRAINT `alumno_ibfk_1` FOREIGN KEY (`cursoID`) REFERENCES `curso` (`cursoID`);

--
-- Filtros para la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`alumnoDNI`) REFERENCES `alumno` (`dni`);

--
-- Filtros para la tabla `clase`
--
ALTER TABLE `clase`
  ADD CONSTRAINT `clase_ibfk_1` FOREIGN KEY (`cursoID`) REFERENCES `curso` (`cursoID`);

--
-- Filtros para la tabla `excepcion`
--
ALTER TABLE `excepcion`
  ADD CONSTRAINT `excepcion_ibfk_1` FOREIGN KEY (`alumnoDNI`) REFERENCES `alumno` (`dni`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
