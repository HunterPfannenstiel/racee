export type MotorsportDTO = {
  id: string;
  name: string;
  slug: string;
};

export interface IMotorsportsQuery {
  execute(): Promise<MotorsportDTO[]>;
}
