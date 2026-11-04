<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fullName = trim($request->input('full_name', ''));
        $email = strtolower(trim($request->input('email', '')));
        $password = $request->input('password');
        $passwordByteLength = is_string($password) ? strlen($password) : 0;

        if (
            strlen($fullName) < 2 || strlen($fullName) > 120 ||
            !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255 ||
            !is_string($password) || strlen($password) < 8 || $passwordByteLength > 72
        ) {
            return response()->json(['error' => 'Enter a valid name, email, and password (8–72 bytes).'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'This email is already registered.'], 409);
        }

        $user = User::create([
            'full_name' => $fullName,
            'email' => $email,
            'password_hash' => Hash::make($password),
            'role' => 'customer',
        ]);

        $token = $user->createToken('caterease_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'user_id' => $user->user_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $email = strtolower(trim($request->input('email', '')));
        $password = $request->input('password');

        if (!$email || !is_string($password)) {
            return response()->json(['error' => 'Enter your email and password.'], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !password_verify($password, $user->password_hash)) {
            return response()->json(['error' => 'Incorrect email or password.'], 401);
        }

        $token = $user->createToken('caterease_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'user_id' => $user->user_id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user_id' => $user->user_id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }
}