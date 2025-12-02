
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/hooks/use-settings';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';


interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings, isInitialized } = useSettings();
  const { setTheme, theme } = useTheme();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('');

  useEffect(() => {
    if (isInitialized) {
      setName(settings.name);
      setCurrency(settings.currency);
    }
  }, [settings.name, settings.currency, isInitialized]);

  const handleSave = () => {
    setSettings({ name, currency });
    onOpenChange(false);
  };
  
  if (!isInitialized) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your personal information and application preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Tabs value={theme} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="light" onClick={() => setTheme('light')}>
                        <Sun className="mr-2 h-4 w-4" /> Light
                    </TabsTrigger>
                    <TabsTrigger value="dark" onClick={() => setTheme('dark')}>
                        <Moon className="mr-2 h-4 w-4" /> Dark
                    </TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
