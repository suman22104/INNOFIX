import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProjectCard({ project }) {
  const { user } = useAuth();
  const memberCount = project.members?.length || 1;
  const maxCapacity = project.maxTeamSize || 4;
  const percentage = Math.min((memberCount / maxCapacity) * 100, 100);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-amber-400 hover:shadow-lg transition-all group">
      
      {/* Left: Author Avatar & Name */}
      <div className="flex flex-col items-center justify-center shrink-0 w-20 sm:w-24">
        <img
          src={
            project.creator?.avatarUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              project.creator?.fullName || 'User'
            )}&background=FBC02D&color=111827&bold=true&size=128`
          }
          alt={project.creator?.fullName}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover mb-2 shadow-sm"
        />
        <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 text-center truncate w-full px-1">
          {project.creator?.fullName || 'Creator'}
        </span>
      </div>

      {/* Middle: Content */}
      <div className="flex-1 min-w-0">
        <Link to={`/projects/${project._id}`}>
          <h3 className="font-bold text-lg sm:text-xl text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors truncate">
            {project.title}
          </h3>
        </Link>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 truncate">
          {project.shortSummary || project.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.requiredSkills?.slice(0, 5).map((skill, i) => (
            <span
              key={i}
              className="text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {skill}
            </span>
          ))}
          {project.requiredSkills?.length > 5 && (
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-500 px-1 py-1 font-medium">
              +{project.requiredSkills.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Right: Status/Visuals & CTA */}
      <div className="flex flex-row sm:flex-col items-center sm:items-center justify-between sm:justify-center shrink-0 gap-4 sm:gap-6 mt-4 sm:mt-0 w-full sm:w-auto">
        {/* Dynamic Capacity Ring with Hover Effect */}
        <div className="w-14 h-14 sm:w-20 sm:h-20 relative hidden sm:block group/chart cursor-pointer">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Background Track */}
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-100 dark:text-slate-700" />
            {/* Progress Fill */}
            <circle 
              cx="50" cy="50" r="40" 
              stroke="#f59e0b" 
              strokeWidth="12" 
              fill="none" 
              strokeDasharray="251.3" 
              strokeDashoffset={251.3 - (percentage / 100) * 251.3} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Centered Content (Icon -> Text on Hover) */}
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <Users className="w-5 h-5 transition-opacity duration-300 opacity-100 group-hover/chart:opacity-0" />
            <span className="absolute text-[11px] sm:text-xs font-bold transition-opacity duration-300 opacity-0 group-hover/chart:opacity-100 text-slate-700 dark:text-slate-200">
              {memberCount}/{maxCapacity}
            </span>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            to={`/projects/${project._id}`}
            className="relative overflow-hidden group/btn h-9 w-full sm:w-28 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-center justify-center shadow-sm"
          >
            {/* Fill effect from left */}
            <div className="absolute inset-y-0 left-0 w-0 bg-amber-400 group-hover/btn:w-full transition-all duration-300 ease-out z-0"></div>
            
            {/* Status Text (visible by default) */}
            <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-bold z-10 transition-all duration-300 group-hover/btn:-translate-y-full group-hover/btn:opacity-0 px-2 text-center">
              {project.status === 'Open' ? 'Live' : project.status}
            </span>
            
            {/* Apply Now Text (hidden by default) */}
            <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-bold text-slate-900 z-10 transition-all duration-300 translate-y-full opacity-0 group-hover/btn:translate-y-0 group-hover/btn:opacity-100 gap-1 px-2 whitespace-nowrap">
              {user?.role === 'admin' ? 'View' : 'Apply Now'} <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
