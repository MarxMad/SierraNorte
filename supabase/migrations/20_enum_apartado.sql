-- Debe correr en su propia migración: Postgres no permite usar un valor
-- de enum nuevo en la misma transacción en que se agrega.
alter type status_operativo add value if not exists 'Apartado' before 'Planeación';
