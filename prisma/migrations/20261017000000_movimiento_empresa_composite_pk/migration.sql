ALTER TABLE `movimiento`
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (`id`, `id_empresa`);
