<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function packages()
    {
        $packages = Package::orderBy('package_id')->get();
        return response()->json($packages);
    }

    public function createPackage(Request $request)
    {
        $name = trim($request->input('name', ''));
        $description = trim($request->input('description', ''));
        $price = (float) $request->input('price_per_guest');
        $minGuests = (int) $request->input('minimum_guests');

        if (strlen($name) < 2 || strlen($name) > 120 || strlen($description) < 5 || strlen($description) > 4000 ||
            $price <= 0 || $price > 99999999 || $minGuests < 1 || $minGuests > 100000) {
            return response()->json(['error' => 'Please enter valid package details.'], 400);
        }

        if (Package::where('name', $name)->exists()) {
            return response()->json(['error' => 'Package name already exists.'], 409);
        }

        $package = Package::create([
            'name' => $name,
            'description' => $description,
            'price_per_guest' => number_format($price, 2, '.', ''),
            'minimum_guests' => $minGuests,
            'is_active' => 1
        ]);

        return response()->json(['package_id' => $package->package_id, 'message' => 'Package created.'], 201);
    }

    public function visibility(Request $request, $id)
    {
        $isActive = $request->input('is_active');
        if (!is_bool($isActive)) {
            return response()->json(['error' => 'Invalid package update.'], 400);
        }

        $package = Package::find($id);
        if (!$package) {
            return response()->json(['error' => 'Package not found.'], 404);
        }

        $package->is_active = $isActive ? 1 : 0;
        $package->save();

        return response()->json(['message' => 'Package availability updated.']);
    }

    public function overview()
    {
        $summary = DB::selectOne("
            SELECT
                COUNT(*) AS total_bookings,
                COALESCE(SUM(status = 'pending'), 0) AS pending_bookings,
                COALESCE(SUM(event_date >= CURDATE() AND status IN ('pending', 'confirmed', 'in_preparation')), 0) AS upcoming_events,
                COALESCE(SUM(CASE WHEN status IN ('confirmed', 'in_preparation', 'completed') THEN quoted_total ELSE 0 END), 0) AS confirmed_booking_value,
                (SELECT COUNT(*) FROM packages WHERE is_active = 1) AS active_packages,
                (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers
            FROM bookings
        ");

        $statusBreakdown = DB::select("
            SELECT status, COUNT(*) AS total
            FROM bookings
            GROUP BY status
            ORDER BY FIELD(status, 'pending', 'confirmed', 'in_preparation', 'completed', 'cancelled')
        ");

        $upcomingEvents = Booking::with(['package', 'customer'])
            ->where('event_date', '>=', date('Y-m-d'))
            ->whereIn('status', ['pending', 'confirmed', 'in_preparation'])
            ->orderBy('event_date', 'asc')
            ->orderBy('event_time', 'asc')
            ->limit(5)
            ->get();

        $recentBookings = Booking::with(['package', 'customer'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $formatBooking = function($b) {
            return [
                'booking_id' => $b->booking_id,
                'event_date' => $b->event_date,
                'event_time' => substr($b->event_time, 0, 5),
                'guest_count' => $b->guest_count,
                'venue' => $b->venue,
                'special_requests' => $b->special_requests,
                'quoted_total' => number_format((float)$b->quoted_total, 2, '.', ''),
                'status' => $b->status,
                'package_name' => $b->package ? $b->package->name : null,
                'full_name' => $b->customer ? $b->customer->full_name : null,
                'email' => $b->customer ? $b->customer->email : null,
            ];
        };

        return response()->json([
            'summary' => $summary,
            'statusBreakdown' => $statusBreakdown,
            'upcomingEvents' => $upcomingEvents->map($formatBooking),
            'recentBookings' => $recentBookings->map($formatBooking)
        ]);
    }

    public function users()
    {
        $users = User::orderBy('role', 'asc')->orderBy('full_name', 'asc')->get();
        
        $formattedUsers = $users->map(function ($user) {
            return [
                'user_id' => $user->user_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at ? $user->created_at->format('Y-m-d') : null,
            ];
        });

        return response()->json($formattedUsers);
    }

    public function updateUserRole(Request $request, $id)
    {
        $role = $request->input('role');
        $allowedRoles = ['customer', 'staff', 'admin'];

        if (!in_array($role, $allowedRoles)) {
            return response()->json(['error' => 'Invalid role.'], 400);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if ($user->user_id === $request->user()->user_id && $role !== 'admin') {
            return response()->json(['error' => 'You cannot demote yourself.'], 400);
        }

        $user->role = $role;
        $user->save();

        return response()->json(['message' => 'User role updated successfully.']);
    }

    public function destroyUser(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        if ($user->role === 'admin') {
            return response()->json(['error' => 'Admin accounts cannot be deleted.'], 403);
        }

        if ($user->user_id === $request->user()->user_id) {
            return response()->json(['error' => 'You cannot delete your own account.'], 400);
        }

        $hasBookings = Booking::where('customer_id', $id)->exists();
        if ($hasBookings) {
            return response()->json(['error' => 'Cannot delete this user because they have existing bookings.'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}