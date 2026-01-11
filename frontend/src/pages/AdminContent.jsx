import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  BookOpen,
  Video,
  FileText
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { fetchApi, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export default function AdminContent({ user }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    week_number: 1,
    title: '',
    description: '',
    video_url: '',
    duration_minutes: 0,
    order: 1,
    is_published: false,
    content: '',
    resources: [],
  });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const data = await fetchApi('/modules');
      setModules(data);
    } catch (error) {
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingModule) {
        await fetchApi(`/modules/${editingModule.module_id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Module updated');
      } else {
        await fetchApi('/modules', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Module created');
      }
      setShowDialog(false);
      setEditingModule(null);
      resetForm();
      loadModules();
    } catch (error) {
      toast.error('Failed to save module');
    }
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setFormData({
      week_number: module.week_number,
      title: module.title,
      description: module.description,
      video_url: module.video_url || '',
      duration_minutes: module.duration_minutes,
      order: module.order,
      is_published: module.is_published,
      content: module.content || '',
      resources: module.resources || [],
    });
    setShowDialog(true);
  };

  const handleDelete = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    try {
      await fetchApi(`/modules/${moduleId}`, { method: 'DELETE' });
      toast.success('Module deleted');
      loadModules();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const togglePublish = async (module) => {
    try {
      await fetchApi(`/modules/${module.module_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...module,
          is_published: !module.is_published,
        }),
      });
      toast.success(module.is_published ? 'Module unpublished' : 'Module published');
      loadModules();
    } catch (error) {
      toast.error('Failed to update module');
    }
  };

  const resetForm = () => {
    setFormData({
      week_number: 1,
      title: '',
      description: '',
      video_url: '',
      duration_minutes: 0,
      order: 1,
      is_published: false,
      content: '',
      resources: [],
    });
  };

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="admin-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Content Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage course modules
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button 
                className="btn-primary-pill"
                onClick={() => { setEditingModule(null); resetForm(); }}
                data-testid="add-module-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingModule ? 'Edit Module' : 'Create New Module'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Week Number</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.week_number}
                      onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) })}
                      data-testid="week-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order in Week</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Module title"
                    data-testid="title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief module description"
                    rows={2}
                    data-testid="description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video URL (YouTube embed)</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content (Markdown)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="## Module Content&#10;&#10;Write your lesson content here using markdown..."
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="content-input"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    data-testid="publish-switch"
                  />
                  <Label>Publish immediately</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 btn-primary-pill" onClick={handleSave} data-testid="save-module-btn">
                    <Save className="w-4 h-4 mr-2" />
                    {editingModule ? 'Update' : 'Create'} Module
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modules Table */}
        <Card data-testid="modules-table">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Week</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Duration</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : modules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No modules yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  modules.map((module) => (
                    <TableRow key={module.module_id} data-testid={`row-${module.module_id}`}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-heading font-bold text-primary">
                          {module.week_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {module.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {module.duration_minutes} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => togglePublish(module)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            module.is_published
                              ? 'bg-accent/10 text-accent hover:bg-accent/20'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {module.is_published ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(module)}
                            data-testid={`edit-${module.module_id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(module.module_id)}
                            data-testid={`delete-${module.module_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
