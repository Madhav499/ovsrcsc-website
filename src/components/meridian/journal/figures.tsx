import type { Dictionary } from '@/i18n';
import {
  CellFigure,
  KeplerFigure,
  LensFigure,
  LogicGateFigure,
  MagnetFigure,
  NewtonianFigure,
  PendulumFigure,
  PhFigure,
  PythagorasFigure,
  RefractionFigure,
  WaveFigure,
} from './illustrations';

export type FigureName =
  | 'pendulum'
  | 'ph'
  | 'cell'
  | 'pythagoras'
  | 'gate'
  | 'refraction'
  | 'lens'
  | 'kepler'
  | 'newtonian'
  | 'wave'
  | 'magnet';

/**
 * Returns a translated, numbered scientific figure from the illustration
 * library. `number` becomes the caption folio ("Fig. 03").
 */
export function ScienceFigure({
  name,
  dict,
  number,
  className,
}: {
  name: FigureName;
  dict: Dictionary;
  number?: number;
  className?: string;
}) {
  const figure = number ? `${dict['mx.figure']} ${String(number).padStart(2, '0')}` : undefined;
  const common = { figure, className };
  switch (name) {
    case 'pendulum':
      return (
        <PendulumFigure
          {...common}
          title={dict['mx.dia.pendulumCaption']}
          caption={dict['mx.dia.pendulumCaption']}
          labels={{ length: dict['mx.dia.length'], amplitude: dict['mx.dia.amplitude'], equilibrium: dict['mx.dia.equilibrium'] }}
        />
      );
    case 'ph':
      return (
        <PhFigure
          {...common}
          title={dict['mx.dia.phCaption']}
          caption={dict['mx.dia.phCaption']}
          labels={{ acidic: dict['mx.dia.acidic'], neutral: dict['mx.dia.neutral'], basic: dict['mx.dia.basic'], water: dict['mx.dia.water'] }}
        />
      );
    case 'cell':
      return (
        <CellFigure
          {...common}
          title={dict['mx.dia.cellCaption']}
          caption={dict['mx.dia.cellCaption']}
          labels={{
            wall: dict['mx.dia.wall'],
            membrane: dict['mx.dia.membrane'],
            nucleus: dict['mx.dia.nucleus'],
            vacuole: dict['mx.dia.vacuole'],
            chloroplast: dict['mx.dia.chloroplast'],
          }}
        />
      );
    case 'pythagoras':
      return <PythagorasFigure {...common} title={dict['mx.dia.pythagorasCaption']} caption={dict['mx.dia.pythagorasCaption']} />;
    case 'gate':
      return (
        <LogicGateFigure
          {...common}
          title={dict['mx.dia.gateCaption']}
          caption={dict['mx.dia.gateCaption']}
          labels={{ inputs: dict['mx.dia.inputs'], output: dict['mx.dia.output'] }}
        />
      );
    case 'refraction':
      return (
        <RefractionFigure
          {...common}
          title={dict['mx.dia.refractionCaption']}
          caption={dict['mx.dia.refractionCaption']}
          labels={{ air: dict['mx.dia.air'], water: dict['mx.dia.waterMedium'], normal: dict['mx.dia.normal'] }}
        />
      );
    case 'lens':
      return (
        <LensFigure
          {...common}
          title={dict['mx.dia.lensCaption']}
          caption={dict['mx.dia.lensCaption']}
          labels={{ object: dict['mx.dia.object'], image: dict['mx.dia.image'] }}
        />
      );
    case 'kepler':
      return (
        <KeplerFigure
          {...common}
          title={dict['mx.dia.keplerCaption']}
          caption={dict['mx.dia.keplerCaption']}
          labels={{
            perihelion: dict['mx.dia.perihelion'],
            aphelion: dict['mx.dia.aphelion'],
            equalAreas: dict['mx.dia.equalAreas'],
            eccentricity: dict['mx.dia.eccentricity'],
          }}
        />
      );
    case 'newtonian':
      return (
        <NewtonianFigure
          {...common}
          title={dict['mx.dia.newtonianCaption']}
          caption={dict['mx.dia.newtonianCaption']}
          labels={{ primary: dict['mx.dia.primary'], secondary: dict['mx.dia.secondary'], eyepiece: dict['mx.dia.eyepiece'], light: dict['mx.dia.light'] }}
        />
      );
    case 'wave':
      return (
        <WaveFigure
          {...common}
          title={dict['mx.dia.waveCaption']}
          caption={dict['mx.dia.waveCaption']}
          labels={{ wavelength: dict['mx.dia.wavelength'], amplitude: dict['mx.dia.amplitude'] }}
        />
      );
    case 'magnet':
      return <MagnetFigure {...common} title={dict['mx.dia.magnetCaption']} caption={dict['mx.dia.magnetCaption']} />;
  }
}
