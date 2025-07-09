import React, { useState } from 'react';
import { Filter, X } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilterValues {
  role?: string;
  status?: string;
  certificationCount?: string;
  joinedAfter?: string;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterValues) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  if (!isOpen) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="text-sm"
        >
          <Filter className="w-4 h-4 mr-2" />
          Advanced Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-600 text-white rounded-full w-2 h-2"></span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Advanced Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">Role</Label>
            <Select value={filters.role || ''} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                <SelectItem value="Senior HVAC Technician">Senior HVAC Technician</SelectItem>
                <SelectItem value="HVAC Installer">HVAC Installer</SelectItem>
                <SelectItem value="Apprentice Technician">Apprentice Technician</SelectItem>
                <SelectItem value="Lead Technician">Lead Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications" className="text-sm font-medium">Certifications</Label>
            <Select value={filters.certificationCount || ''} onValueChange={(value) => handleFilterChange('certificationCount', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any amount</SelectItem>
                <SelectItem value="0-2">0-2 certifications</SelectItem>
                <SelectItem value="3-5">3-5 certifications</SelectItem>
                <SelectItem value="6+">6+ certifications</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="joinedAfter" className="text-sm font-medium">Joined After</Label>
            <Input
              id="joinedAfter"
              type="date"
              value={filters.joinedAfter || ''}
              onChange={(e) => handleFilterChange('joinedAfter', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Button variant="outline" onClick={clearFilters} disabled={!hasActiveFilters}>
            Clear All
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 