
import React, { useState } from 'react';
import type { DefaultMonitoring, Rating, Area } from '../types';
import { WatchlistStatus, ratingOptions, segmentoOptions, areaOptions } from '../types';
import Modal from './Modal';
import { Label, Input, Select, FormRow } from './UI';

interface OperationFormProps {
  onClose: () => void;
  onSave: (operationData: any) => void;
}

const defaultMonitoringInitial: DefaultMonitoring = {
  news: false,
  fiiReport: false,
  operationalInfo: false,
  receivablesPortfolio: false,
  monthlyConstructionReport: false,
  monthlyCommercialInfo: false,
  speDfs: false,
};

interface CheckboxProps {
    name: keyof DefaultMonitoring;
    label: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
const Checkbox: React.FC<CheckboxProps> = ({ name, label, checked, onChange }) => (
    <div className="flex items-center">
        <input id={name} name={name} type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-900">{label}</label>
    </div>
);


const OperationForm: React.FC<OperationFormProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [area, setArea] = useState<Area>('CRI');
  const [projects, setProjects] = useState('');
  const [operationType, setOperationType] = useState('CRI');
  const [guarantees, setGuarantees] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [responsibleAnalyst, setResponsibleAnalyst] = useState('');
  const [reviewFrequency, setReviewFrequency] = useState('Trimestral');
  const [callFrequency, setCallFrequency] = useState('Mensal');
  const [dfFrequency, setDfFrequency] = useState('Trimestral');
  const [segmento, setSegmento] = useState(segmentoOptions[0]);
  const [defaultMonitoring, setDefaultMonitoring] = useState<DefaultMonitoring>(defaultMonitoringInitial);

  const [ratingOperation, setRatingOperation] = useState<Rating>('Baa3');
  const [ratingGroup, setRatingGroup] = useState<Rating>('Baa1');
  const [watchlist, setWatchlist] = useState<WatchlistStatus>(WatchlistStatus.VERDE);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setDefaultMonitoring(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newOperationData = {
      name,
      area,
      projects: projects.split(',').map((p, i) => ({ id: i, name: p.trim() })).filter(p => p.name),
      operationType,
      guarantees: guarantees.split(',').map((g, i) => ({ id: i, name: g.trim() })).filter(g => g.name),
      maturityDate: maturityDate ? new Date(maturityDate + 'T12:00:00').toISOString() : null,
      responsibleAnalyst,
      reviewFrequency,
      callFrequency,
      dfFrequency,
      segmento,
      defaultMonitoring,
      ratingOperation,
      ratingGroup,
      watchlist,
      covenants: { ltv: null, dscr: null }, 
    };
    onSave(newOperationData);
    onClose();
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Adicionar Nova Operação">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormRow>
          <div>
            <Label htmlFor="name">Nome da Operação</Label>
            <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="area">Área de Negócio</Label>
            <Select id="area" value={area} onChange={e => setArea(e.target.value as Area)} required>
                {areaOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </FormRow>

        <FormRow>
            <div>
                <Label htmlFor="projects">Projetos (separados por vírgula)</Label>
                <Input id="projects" type="text" value={projects} onChange={e => setProjects(e.target.value)} />
            </div>
             <div>
                <Label htmlFor="guarantees">Garantias (separadas por vírgula)</Label>
                <Input id="guarantees" type="text" value={guarantees} onChange={e => setGuarantees(e.target.value)} />
            </div>
        </FormRow>

        <FormRow>
          <div>
            <Label htmlFor="operationType">Tipo de Operação</Label>
            <Select id="operationType" value={operationType} onChange={e => setOperationType(e.target.value)}>
                <option>CRI</option>
                <option>CRA</option>
                <option>FIDC</option>
                <option>Debênture</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="segmento">Segmento</Label>
            <Select id="segmento" value={segmento} onChange={e => setSegmento(e.target.value)}>
                {segmentoOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </FormRow>
        <FormRow>
            <div>
                <Label htmlFor="maturityDate">Data de Vencimento</Label>
                <Input id="maturityDate" type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} required />
            </div>
             <div>
                <Label htmlFor="responsibleAnalyst">Analista Responsável</Label>
                <Input id="responsibleAnalyst" type="text" value={responsibleAnalyst} onChange={e => setResponsibleAnalyst(e.target.value)} required />
            </div>
        </FormRow>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <Label htmlFor="ratingOperation">Rating Operação</Label>
                <Select id="ratingOperation" value={ratingOperation} onChange={e => setRatingOperation(e.target.value as Rating)}>
                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            <div>
                <Label htmlFor="ratingGroup">Rating Grupo Econômico</Label>
                <Select id="ratingGroup" value={ratingGroup} onChange={e => setRatingGroup(e.target.value as Rating)}>
                    {ratingOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            <div>
                <Label htmlFor="watchlist">Farol Watchlist</Label>
                <Select id="watchlist" value={watchlist} onChange={e => setWatchlist(e.target.value as WatchlistStatus)}>
                    {Object.values(WatchlistStatus).map(w => <option key={w} value={w}>{w}</option>)}
                </Select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <Label htmlFor="reviewFrequency">Frequência de Revisão</Label>
                <Select id="reviewFrequency" value={reviewFrequency} onChange={e => setReviewFrequency(e.target.value)}>
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                </Select>
            </div>
            <div>
                <Label htmlFor="callFrequency">Frequência de Calls</Label>
                <Select id="callFrequency" value={callFrequency} onChange={e => setCallFrequency(e.target.value)}>
                    <option>Semanal</option>
                    <option>Quinzenal</option>
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                </Select>
            </div>
            <div>
                <Label htmlFor="dfFrequency">Frequência DFs & Dívida</Label>
                <Select id="dfFrequency" value={dfFrequency} onChange={e => setDfFrequency(e.target.value)}>
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                </Select>
            </div>
        </div>
        
        <div>
            <Label htmlFor="">Monitoramentos Padrão</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-md">
                <Checkbox name="news" label="Monitorar Notícias" checked={defaultMonitoring.news} onChange={handleCheckboxChange} />
                <Checkbox name="fiiReport" label="Verificar Relatório FII" checked={defaultMonitoring.fiiReport} onChange={handleCheckboxChange} />
                <Checkbox name="operationalInfo" label="Info Operacional" checked={defaultMonitoring.operationalInfo} onChange={handleCheckboxChange} />
                <Checkbox name="receivablesPortfolio" label="Carteira de Recebíveis" checked={defaultMonitoring.receivablesPortfolio} onChange={handleCheckboxChange} />
                <Checkbox name="monthlyConstructionReport" label="Relatório Mensal de Obra" checked={defaultMonitoring.monthlyConstructionReport} onChange={handleCheckboxChange} />
                <Checkbox name="monthlyCommercialInfo" label="Info Comercial Mensal" checked={defaultMonitoring.monthlyCommercialInfo} onChange={handleCheckboxChange} />
                <Checkbox name="speDfs" label="DFs da SPE" checked={defaultMonitoring.speDfs} onChange={handleCheckboxChange} />
            </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar Operação</button>
        </div>
      </form>
    </Modal>
  );
};

export default OperationForm;
