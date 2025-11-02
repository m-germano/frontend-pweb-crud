import type { Country } from '@/api/types'
import FlagImage from './FlagImage'
import { Users, Languages, Clock, DollarSign } from 'lucide-react';

type Props = { country: Country }

export default function CountryCard({ country }: Props) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <FlagImage 
            iso2={country.iso2} 
            countryName={country.nome}
            alt={country.nome} 
            size={48} 
          />
          <div>
            <div className="font-semibold text-lg">
              {country.nome} 
              {country.iso2 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({country.iso2})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              {country.populacao.toLocaleString('pt-BR')} habitantes
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        {country.idiomaOficial && (
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Idioma:</span>
            <span>{country.idiomaOficial}</span>
          </div>
        )}
        
        {country.moeda && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Moeda:</span>
            <span>{country.moeda}</span>
          </div>
        )}
        
        {country.fusoHorario && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Fuso:</span>
            <span>{country.fusoHorario}</span>
          </div>
        )}
      </div>
    </div>
  );
}